import { relations } from "drizzle-orm";
import {
  bigint,
  boolean,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

// ============================================
// Users
// ============================================
export const users = pgTable(
  "users",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    email: varchar("email", { length: 255 }).notNull().default(""),
    encryptedPassword: varchar("encrypted_password", { length: 255 }).notNull().default(""),
    resetPasswordToken: varchar("reset_password_token", { length: 255 }),
    resetPasswordSentAt: timestamp("reset_password_sent_at"),
    rememberCreatedAt: timestamp("remember_created_at"),
    name: varchar("name", { length: 255 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("users_email_idx").on(table.email),
    uniqueIndex("users_reset_password_token_idx").on(table.resetPasswordToken),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  todos: many(todos),
  categories: many(categories),
  tags: many(tags),
  comments: many(comments),
  notes: many(notes),
  todoHistories: many(todoHistories),
  noteRevisions: many(noteRevisions),
}));

// ============================================
// Categories
// ============================================
export const categories = pgTable(
  "categories",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 50 }).notNull(),
    color: varchar("color", { length: 7 }).notNull().default("#6B7280"),
    todosCount: integer("todos_count").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("categories_user_id_idx").on(table.userId),
    uniqueIndex("categories_user_id_name_idx").on(table.userId, table.name),
  ],
);

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, {
    fields: [categories.userId],
    references: [users.id],
  }),
  todos: many(todos),
}));

// ============================================
// Tags
// ============================================
export const tags = pgTable(
  "tags",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 30 }).notNull(),
    color: varchar("color", { length: 7 }).default("#6B7280"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("tags_user_id_idx").on(table.userId),
    uniqueIndex("tags_user_id_name_idx").on(table.userId, table.name),
  ],
);

export const tagsRelations = relations(tags, ({ one, many }) => ({
  user: one(users, {
    fields: [tags.userId],
    references: [users.id],
  }),
  todoTags: many(todoTags),
}));

// ============================================
// Todos
// ============================================
export const todos = pgTable(
  "todos",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    categoryId: bigint("category_id", { mode: "number" }).references(() => categories.id, {
      onDelete: "set null",
    }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    completed: boolean("completed").default(false),
    position: integer("position"),
    priority: integer("priority").notNull().default(1), // 0: low, 1: medium, 2: high
    status: integer("status").notNull().default(0), // 0: pending, 1: in_progress, 2: completed
    dueDate: date("due_date"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("todos_user_id_idx").on(table.userId),
    index("todos_category_id_idx").on(table.categoryId),
    index("todos_user_id_category_id_idx").on(table.userId, table.categoryId),
    index("todos_user_id_due_date_idx").on(table.userId, table.dueDate),
    index("todos_user_id_position_idx").on(table.userId, table.position),
    index("todos_user_id_priority_idx").on(table.userId, table.priority),
    index("todos_user_id_status_idx").on(table.userId, table.status),
    index("todos_title_idx").on(table.title),
    index("todos_due_date_idx").on(table.dueDate),
    index("todos_position_idx").on(table.position),
    index("todos_priority_idx").on(table.priority),
    index("todos_status_idx").on(table.status),
    index("todos_created_at_idx").on(table.createdAt),
    index("todos_updated_at_idx").on(table.updatedAt),
  ],
);

export const todosRelations = relations(todos, ({ one, many }) => ({
  user: one(users, {
    fields: [todos.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [todos.categoryId],
    references: [categories.id],
  }),
  todoTags: many(todoTags),
  comments: many(comments),
  histories: many(todoHistories),
  files: many(files),
}));

// ============================================
// TodoTags (Junction Table)
// ============================================
export const todoTags = pgTable(
  "todo_tags",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    todoId: bigint("todo_id", { mode: "number" })
      .notNull()
      .references(() => todos.id, { onDelete: "cascade" }),
    tagId: bigint("tag_id", { mode: "number" })
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("todo_tags_todo_id_idx").on(table.todoId),
    index("todo_tags_tag_id_idx").on(table.tagId),
    uniqueIndex("todo_tags_todo_id_tag_id_idx").on(table.todoId, table.tagId),
  ],
);

export const todoTagsRelations = relations(todoTags, ({ one }) => ({
  todo: one(todos, {
    fields: [todoTags.todoId],
    references: [todos.id],
  }),
  tag: one(tags, {
    fields: [todoTags.tagId],
    references: [tags.id],
  }),
}));

// ============================================
// Comments (Polymorphic - currently Todo only)
// ============================================
export const comments = pgTable(
  "comments",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    commentableType: varchar("commentable_type", { length: 50 }).notNull(),
    commentableId: bigint("commentable_id", { mode: "number" }).notNull(),
    content: text("content").notNull(),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("comments_user_id_idx").on(table.userId),
    index("comments_commentable_idx").on(table.commentableType, table.commentableId),
    index("comments_commentable_deleted_at_idx").on(
      table.commentableType,
      table.commentableId,
      table.deletedAt,
    ),
    index("comments_deleted_at_idx").on(table.deletedAt),
  ],
);

export const commentsRelations = relations(comments, ({ one }) => ({
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));

// ============================================
// TodoHistories
// ============================================
export const todoHistories = pgTable(
  "todo_histories",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    todoId: bigint("todo_id", { mode: "number" })
      .notNull()
      .references(() => todos.id, { onDelete: "cascade" }),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    fieldName: varchar("field_name", { length: 50 }).notNull(),
    oldValue: text("old_value"),
    newValue: text("new_value"),
    action: integer("action").notNull().default(0), // 0: created, 1: updated, 2: deleted, 3: status_changed, 4: priority_changed
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("todo_histories_todo_id_idx").on(table.todoId),
    index("todo_histories_user_id_idx").on(table.userId),
    index("todo_histories_todo_id_created_at_idx").on(table.todoId, table.createdAt),
    index("todo_histories_field_name_idx").on(table.fieldName),
  ],
);

export const todoHistoriesRelations = relations(todoHistories, ({ one }) => ({
  todo: one(todos, {
    fields: [todoHistories.todoId],
    references: [todos.id],
  }),
  user: one(users, {
    fields: [todoHistories.userId],
    references: [users.id],
  }),
}));

// ============================================
// Notes
// ============================================
export const notes = pgTable(
  "notes",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 150 }),
    bodyMd: text("body_md"),
    bodyPlain: text("body_plain"),
    pinned: boolean("pinned").notNull().default(false),
    archivedAt: timestamp("archived_at"),
    trashedAt: timestamp("trashed_at"),
    lastEditedAt: timestamp("last_edited_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("notes_user_id_idx").on(table.userId),
    index("notes_user_id_archived_at_idx").on(table.userId, table.archivedAt),
    index("notes_user_id_trashed_at_idx").on(table.userId, table.trashedAt),
    index("notes_user_id_pinned_idx").on(table.userId, table.pinned),
    index("notes_user_id_last_edited_at_idx").on(table.userId, table.lastEditedAt),
    index("notes_archived_at_idx").on(table.archivedAt),
    index("notes_trashed_at_idx").on(table.trashedAt),
    index("notes_pinned_idx").on(table.pinned),
    index("notes_last_edited_at_idx").on(table.lastEditedAt),
  ],
);

export const notesRelations = relations(notes, ({ one, many }) => ({
  user: one(users, {
    fields: [notes.userId],
    references: [users.id],
  }),
  revisions: many(noteRevisions),
}));

// ============================================
// NoteRevisions
// ============================================
export const noteRevisions = pgTable(
  "note_revisions",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    noteId: bigint("note_id", { mode: "number" })
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 150 }),
    bodyMd: text("body_md"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("note_revisions_note_id_idx").on(table.noteId),
    index("note_revisions_user_id_idx").on(table.userId),
    index("note_revisions_note_id_created_at_idx").on(table.noteId, table.createdAt),
  ],
);

export const noteRevisionsRelations = relations(noteRevisions, ({ one }) => ({
  note: one(notes, {
    fields: [noteRevisions.noteId],
    references: [notes.id],
  }),
  user: one(users, {
    fields: [noteRevisions.userId],
    references: [users.id],
  }),
}));

// ============================================
// JWT Denylist
// ============================================
export const jwtDenylists = pgTable(
  "jwt_denylists",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    jti: varchar("jti", { length: 255 }),
    exp: timestamp("exp"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("jwt_denylists_jti_idx").on(table.jti)],
);

// ============================================
// Files (for S3 storage)
// ============================================
export const files = pgTable(
  "files",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    attachableType: varchar("attachable_type", { length: 50 }).notNull(),
    attachableId: bigint("attachable_id", { mode: "number" }).notNull(),
    filename: varchar("filename", { length: 255 }).notNull(),
    contentType: varchar("content_type", { length: 100 }),
    byteSize: bigint("byte_size", { mode: "number" }).notNull(),
    storageKey: varchar("storage_key", { length: 500 }).notNull(),
    thumbKey: varchar("thumb_key", { length: 500 }),
    mediumKey: varchar("medium_key", { length: 500 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("files_user_id_idx").on(table.userId),
    index("files_attachable_idx").on(table.attachableType, table.attachableId),
    index("files_storage_key_idx").on(table.storageKey),
  ],
);

export const filesRelations = relations(files, ({ one }) => ({
  user: one(users, {
    fields: [files.userId],
    references: [users.id],
  }),
}));

// ============================================
// Type Exports
// ============================================
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;

export type Todo = typeof todos.$inferSelect;
export type NewTodo = typeof todos.$inferInsert;

export type TodoTag = typeof todoTags.$inferSelect;
export type NewTodoTag = typeof todoTags.$inferInsert;

export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;

export type TodoHistory = typeof todoHistories.$inferSelect;
export type NewTodoHistory = typeof todoHistories.$inferInsert;

export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;

export type NoteRevision = typeof noteRevisions.$inferSelect;
export type NewNoteRevision = typeof noteRevisions.$inferInsert;

export type JwtDenylist = typeof jwtDenylists.$inferSelect;
export type NewJwtDenylist = typeof jwtDenylists.$inferInsert;

export type File = typeof files.$inferSelect;
export type NewFile = typeof files.$inferInsert;
