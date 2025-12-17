import bcrypt from "bcrypt";
import * as jose from "jose";
import { v4 as uuidv4 } from "uuid";
import { getConfig } from "../lib/config";
import { conflict, unauthorized } from "../lib/errors";
import type { User } from "../models/schema";
import type { JwtDenylistRepositoryInterface } from "../repositories/jwt-denylist";
import type { UserRepositoryInterface } from "../repositories/user";

/** bcryptのコスト係数 */
const BCRYPT_COST = 12;

/** JWTの有効期限 */
const JWT_EXPIRES_IN = "24h";

/** JWTペイロードの型定義 */
export interface TokenPayload {
  /** ユーザーID（文字列） */
  sub: string;
  /** JWT ID（一意識別子） */
  jti: string;
  /** ユーザーのメールアドレス */
  email: string;
  /** 有効期限（UNIX時間） */
  exp: number;
  /** 発行時刻（UNIX時間） */
  iat: number;
}

/** 認証レスポンスの型定義 */
export interface AuthResponse {
  /** ユーザー情報 */
  user: {
    id: number;
    email: string;
    name: string | null;
    created_at: string;
    updated_at: string;
  };
  /** 認証トークン */
  token: string;
}

/**
 * 認証サービスクラス
 * ユーザー登録、ログイン、ログアウト、トークン管理を提供する
 */
export class AuthService {
  /**
   * AuthServiceを作成する
   * @param userRepository - ユーザーリポジトリ
   * @param jwtDenylistRepository - JWTデナイリストリポジトリ
   */
  constructor(
    private userRepository: UserRepositoryInterface,
    private jwtDenylistRepository: JwtDenylistRepositoryInterface,
  ) {}

  /**
   * 新規ユーザーを登録する
   * @param email - メールアドレス
   * @param password - パスワード
   * @param passwordConfirmation - パスワード確認
   * @param name - ユーザー名（オプション）
   * @returns 認証レスポンス（ユーザー情報とトークン）
   * @throws パスワードが一致しない場合は401エラー
   * @throws メールアドレスが既に登録されている場合は409エラー
   */
  async signUp(
    email: string,
    password: string,
    passwordConfirmation: string,
    name?: string,
  ): Promise<AuthResponse> {
    if (password !== passwordConfirmation) {
      throw unauthorized("パスワードが一致しません");
    }

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw conflict("このメールアドレスは既に登録されています");
    }

    const encryptedPassword = await bcrypt.hash(password, BCRYPT_COST);

    const user = await this.userRepository.create({
      email,
      encryptedPassword,
      name: name || null,
    });

    const token = await this.generateToken(user);

    return {
      user: this.formatUser(user),
      token,
    };
  }

  /**
   * ユーザーをログインさせる
   * @param email - メールアドレス
   * @param password - パスワード
   * @returns 認証レスポンス（ユーザー情報とトークン）
   * @throws メールアドレスまたはパスワードが正しくない場合は401エラー
   */
  async signIn(email: string, password: string): Promise<AuthResponse> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw unauthorized("メールアドレスまたはパスワードが正しくありません");
    }

    const isValid = await bcrypt.compare(password, user.encryptedPassword);
    if (!isValid) {
      throw unauthorized("メールアドレスまたはパスワードが正しくありません");
    }

    const token = await this.generateToken(user);

    return {
      user: this.formatUser(user),
      token,
    };
  }

  /**
   * ユーザーをログアウトさせる（トークンを無効化）
   * @param jti - JWT ID
   * @param exp - トークンの有効期限
   */
  async signOut(jti: string, exp: Date): Promise<void> {
    await this.jwtDenylistRepository.add(jti, exp);
  }

  /**
   * JWTトークンを生成する
   * @param user - ユーザー
   * @returns JWTトークン文字列
   */
  async generateToken(user: User): Promise<string> {
    const config = getConfig();
    const secret = new TextEncoder().encode(config.JWT_SECRET);
    const jti = uuidv4();

    const token = await new jose.SignJWT({
      sub: String(user.id),
      jti,
      email: user.email,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(JWT_EXPIRES_IN)
      .sign(secret);

    return token;
  }

  /**
   * JWTトークンを検証する
   * @param token - JWTトークン文字列
   * @returns トークンペイロード
   * @throws トークンが無効または無効化されている場合は401エラー
   */
  async validateToken(token: string): Promise<TokenPayload> {
    const config = getConfig();
    const secret = new TextEncoder().encode(config.JWT_SECRET);

    const { payload } = await jose.jwtVerify(token, secret);

    const jti = payload.jti;
    if (typeof jti !== "string") {
      throw unauthorized("無効なトークンです");
    }

    const isDenied = await this.jwtDenylistRepository.exists(jti);
    if (isDenied) {
      throw unauthorized("トークンは無効化されています");
    }

    const sub = payload.sub;
    const email = payload.email;
    const exp = payload.exp;
    const iat = payload.iat;

    if (typeof sub !== "string" || typeof email !== "string" || typeof exp !== "number" || typeof iat !== "number") {
      throw unauthorized("無効なトークンです");
    }

    return {
      sub,
      jti,
      email,
      exp,
      iat,
    };
  }

  /**
   * ユーザーをレスポンス形式にフォーマットする
   * @param user - ユーザーエンティティ
   * @returns フォーマットされたユーザー情報
   */
  private formatUser(user: User): AuthResponse["user"] {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      created_at: user.createdAt.toISOString(),
      updated_at: user.updatedAt.toISOString(),
    };
  }
}
