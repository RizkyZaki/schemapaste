import * as vscode from "vscode";
import type { WorkspaceExportFormat } from "../exporters/types";
import type { SchemaSourceType } from "../types/normalizedSchema";
import { WorkspaceExportService } from "../exporters/exportService";
import { WorkspaceRepository } from "../storage/workspaceRepository";
import { SCHEMAPASTE_CUSTOM_EDITOR_VIEW_TYPE } from "../custom-editor/workspaceEditorProvider";
import { WorkspaceHistoryTreeProvider } from "../sidebar/workspaceTreeProvider";
import { createDefaultParserRegistry } from "../parsers/registry/createDefaultParserRegistry";

interface WorkspaceCommandArg {
  id?: string;
  workspace?: {
    id?: string;
  };
}

const SUPPORTED_SOURCES: SchemaSourceType[] = [
  "sql",
  "laravel",
  "prisma",
  "drizzle",
  "typeorm",
  "sequelize",
  "django"
];

function starterSource(sourceType: SchemaSourceType): string {
  switch (sourceType) {
    case "sql":
      return `CREATE TABLE users (
  id INT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at DATETIME
);

CREATE TABLE posts (
  id INT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);`;
    case "laravel":
      return `Schema::create('users', function (Blueprint $table) {
    $table->id();
    $table->string('email')->unique();
    $table->timestamps();
});

Schema::create('posts', function (Blueprint $table) {
    $table->id();
    $table->unsignedBigInteger('user_id');
    $table->string('title');
    $table->text('body')->nullable();
    $table->foreign('user_id')->references('id')->on('users');
});`;
    case "prisma":
      return `model User {
  id    Int    @id
  email String @unique
  posts Post[]
}

model Post {
  id     Int  @id
  userId Int
  user   User @relation(fields: [userId], references: [id])
}`;
    case "drizzle":
      return `export const users = pgTable('users', {
  id: integer('id').primaryKey(),
  email: varchar('email').notNull().unique()
});

export const posts = pgTable('posts', {
  id: integer('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  title: varchar('title').notNull()
});`;
    case "typeorm":
      return `@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;
}

@Entity()
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}`;
    case "sequelize":
      return `sequelize.define('users', {
  id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true }
});

sequelize.define('posts', {
  id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
  title: { type: DataTypes.STRING, allowNull: false }
});`;
    case "django":
      return `class User(models.Model):
    id = models.AutoField(primary_key=True)
    email = models.CharField(max_length=255, unique=True)


class Post(models.Model):
    id = models.AutoField(primary_key=True)
    user_id = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)`;
    default:
      return "";
  }
}

export function registerWorkspaceCommands(
  context: vscode.ExtensionContext,
  repository: WorkspaceRepository,
  historyProvider: WorkspaceHistoryTreeProvider,
  exportService: WorkspaceExportService
): void {
  const parserRegistry = createDefaultParserRegistry();

  context.subscriptions.push(
    vscode.commands.registerCommand("schemapaste.newWorkspace", async () => {
      const sourceType = await pickSourceType();
      if (!sourceType) {
        return;
      }

      const source = starterSource(sourceType);
      const parser = parserRegistry.resolve(sourceType);
      const parsed = parser.parse(source);

      const created = await repository.create({
        name: "Untitled ERD",
        sourceType,
        originalSourceContent: source,
        normalizedSchema:
          parsed.schema ?? {
            sourceType,
            tables: [],
            enums: [],
            relationships: []
          }
      });

      await openWorkspaceInCustomEditor(created.id);
      historyProvider.refresh();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("schemapaste.openWorkspace", async (arg?: string | WorkspaceCommandArg) => {
      const workspaceId = resolveWorkspaceId(arg);
      if (workspaceId) {
        await openWorkspaceInCustomEditor(workspaceId);
        return;
      }

      const workspaces = await repository.list();
      const picked = await vscode.window.showQuickPick(
        workspaces.map((workspace) => ({
          label: workspace.name,
          description: `${workspace.sourceType.toUpperCase()} • ${workspace.pinned ? "Pinned" : "History"}`,
          detail: `Updated ${new Date(workspace.updatedAt).toLocaleString()}`,
          id: workspace.id
        })),
        { placeHolder: "Select workspace to open" }
      );

      if (!picked) {
        return;
      }

      await openWorkspaceInCustomEditor(picked.id);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("schemapaste.renameWorkspace", async (arg?: string | WorkspaceCommandArg) => {
      const id = resolveWorkspaceId(arg) ?? (await pickWorkspaceId(repository));
      if (!id) {
        return;
      }

      const existing = repository.getById(id);
      if (!existing) {
        return;
      }

      const nextName = await vscode.window.showInputBox({
        value: existing.name,
        placeHolder: "New workspace name"
      });

      if (!nextName || nextName.trim().length === 0) {
        return;
      }

      await repository.rename(id, nextName.trim());
      historyProvider.refresh();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("schemapaste.duplicateWorkspace", async (arg?: string | WorkspaceCommandArg) => {
      const id = resolveWorkspaceId(arg) ?? (await pickWorkspaceId(repository));
      if (!id) {
        return;
      }

      const duplicated = await repository.duplicate(id);
      if (!duplicated) {
        return;
      }

      historyProvider.refresh();
      await openWorkspaceInCustomEditor(duplicated.id);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("schemapaste.deleteWorkspace", async (arg?: string | WorkspaceCommandArg) => {
      const id = resolveWorkspaceId(arg) ?? (await pickWorkspaceId(repository));
      if (!id) {
        return;
      }

      const confirm = await vscode.window.showWarningMessage(
        "Delete this workspace from SchemaPaste history?",
        { modal: true },
        "Delete"
      );

      if (confirm !== "Delete") {
        return;
      }

      await repository.delete(id);
      historyProvider.refresh();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("schemapaste.togglePinWorkspace", async (arg?: string | WorkspaceCommandArg) => {
      const id = resolveWorkspaceId(arg) ?? (await pickWorkspaceId(repository));
      if (!id) {
        return;
      }

      const existing = repository.getById(id);
      if (!existing) {
        return;
      }

      await repository.setPinned(id, !existing.pinned);
      historyProvider.refresh();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("schemapaste.searchWorkspace", async () => {
      const query = await vscode.window.showInputBox({ placeHolder: "Search workspace history" });
      historyProvider.setSearch(query ?? "");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("schemapaste.sortWorkspace", async () => {
      await historyProvider.toggleSort();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("schemapaste.exportWorkspace", async (arg?: string | WorkspaceCommandArg) => {
      const id = resolveWorkspaceId(arg) ?? (await pickWorkspaceId(repository));
      if (!id) {
        return;
      }

      const existing = repository.getById(id);
      if (!existing) {
        return;
      }

      const format = await pickExportFormat();
      if (!format) {
        return;
      }

      await exportService.exportToFile(existing, format);
    })
  );

  async function openWorkspaceInCustomEditor(workspaceId: string): Promise<void> {
    const uri = vscode.Uri.parse(`untitled:SchemaPaste-${workspaceId}.schemapaste?workspaceId=${workspaceId}`);
    await vscode.commands.executeCommand("vscode.openWith", uri, SCHEMAPASTE_CUSTOM_EDITOR_VIEW_TYPE, {
      preview: false
    });
  }
}

function resolveWorkspaceId(arg?: string | WorkspaceCommandArg): string | undefined {
  if (!arg) {
    return undefined;
  }

  if (typeof arg === "string") {
    return arg;
  }

  if (typeof arg.id === "string" && arg.id.length > 0) {
    return arg.id;
  }

  if (arg.workspace?.id && typeof arg.workspace.id === "string") {
    return arg.workspace.id;
  }

  return undefined;
}

async function pickWorkspaceId(repository: WorkspaceRepository): Promise<string | undefined> {
  const workspaces = await repository.list();
  const picked = await vscode.window.showQuickPick(
    workspaces.map((workspace) => ({
      label: workspace.name,
      description: workspace.sourceType,
      id: workspace.id
    })),
    { placeHolder: "Select workspace" }
  );

  return picked?.id;
}

async function pickSourceType(): Promise<SchemaSourceType | undefined> {
  const picked = await vscode.window.showQuickPick(
    SUPPORTED_SOURCES.map((sourceType) => ({ label: sourceType.toUpperCase(), sourceType })),
    { placeHolder: "Select source type" }
  );
  return picked?.sourceType;
}

async function pickExportFormat(): Promise<WorkspaceExportFormat | undefined> {
  const options: WorkspaceExportFormat[] = [
    "png",
    "svg",
    "pdf",
    "json",
    "normalized-json",
    "source",
    "markdown",
    "sql",
    "laravel",
    "prisma",
    "drizzle",
    "typeorm",
    "sequelize",
    "django"
  ];

  const picked = await vscode.window.showQuickPick(options.map((format) => ({ label: format.toUpperCase(), format })), {
    placeHolder: "Choose export format"
  });

  return picked?.format;
}
