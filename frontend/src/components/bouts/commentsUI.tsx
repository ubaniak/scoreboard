import { CloseOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { App, Button, Input, Popconfirm, Space } from "antd";
import { useState } from "react";
import type { Comment } from "../../api/comments";
import { radius, space, useTheme } from "../../theme";

export type DraftCommentsListProps = {
  comments: string[];
  onAdd: (text: string) => void;
  onRemove: (index: number) => void;
};

export const DraftCommentsList = (props: DraftCommentsListProps) => {
  const { colors } = useTheme();
  const [draft, setDraft] = useState("");

  const handleAdd = () => {
    const text = draft.trim();
    if (!text) return;
    props.onAdd(text);
    setDraft("");
  };

  return (
    <div>
      <Input.TextArea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={2}
        placeholder="Add a comment…"
        style={{ marginBottom: space.sm }}
      />
      <Button type="dashed" onClick={handleAdd} disabled={!draft.trim()} style={{ marginBottom: space.md }}>
        Add comment
      </Button>

      {props.comments.length === 0 ? (
        <div
          style={{
            padding: 24,
            textAlign: "center",
            color: colors.textFaint,
            fontSize: 13,
            border: `1px dashed ${colors.border}`,
            borderRadius: radius.lg,
          }}
        >
          No comments yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {props.comments.map((text, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 12px",
                borderRadius: radius.md,
                background: colors.bg,
                border: `1px solid ${colors.borderSubtle}`,
              }}
            >
              <span style={{ flex: 1, fontSize: 13, whiteSpace: "pre-wrap" }}>{text}</span>
              <Button type="text" size="small" icon={<CloseOutlined />} onClick={() => props.onRemove(i)} aria-label="Remove comment" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export type PersistedCommentsListProps = {
  comments: Comment[];
  onAdd: (text: string) => Promise<unknown>;
  onUpdate: (commentId: number, text: string) => Promise<unknown>;
  onDelete: (commentId: number) => Promise<unknown>;
};

export const PersistedCommentsList = (props: PersistedCommentsListProps) => {
  const { colors } = useTheme();
  const { message } = App.useApp();
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const handleAdd = async () => {
    const text = draft.trim();
    if (!text) return;
    setAdding(true);
    try {
      await props.onAdd(text);
      setDraft("");
    } catch (err) {
      message.error((err as Error).message || "Failed to add comment");
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditingText(comment.comment);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText("");
  };

  const saveEdit = async () => {
    if (editingId == null) return;
    const text = editingText.trim();
    if (!text) return;
    setSavingEdit(true);
    try {
      await props.onUpdate(editingId, text);
      cancelEdit();
    } catch (err) {
      message.error((err as Error).message || "Failed to update comment");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = (commentId: number) => {
    props.onDelete(commentId).catch((err: unknown) => {
      message.error((err as Error).message || "Failed to delete comment");
    });
  };

  return (
    <div>
      <Input.TextArea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={2}
        placeholder="Add a comment…"
        style={{ marginBottom: space.sm }}
      />
      <Button type="dashed" onClick={handleAdd} loading={adding} disabled={!draft.trim()} style={{ marginBottom: space.md }}>
        Add comment
      </Button>

      {props.comments.length === 0 ? (
        <div
          style={{
            padding: 24,
            textAlign: "center",
            color: colors.textFaint,
            fontSize: 13,
            border: `1px dashed ${colors.border}`,
            borderRadius: radius.lg,
          }}
        >
          No comments yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {props.comments.map((comment) => (
            <div
              key={comment.id}
              style={{
                padding: "8px 12px",
                borderRadius: radius.md,
                background: colors.bg,
                border: `1px solid ${colors.borderSubtle}`,
              }}
            >
              {editingId === comment.id ? (
                <div>
                  <Input.TextArea
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    rows={2}
                    style={{ marginBottom: space.sm }}
                  />
                  <Space>
                    <Button type="text" size="small" onClick={cancelEdit}>
                      Cancel
                    </Button>
                    <Button type="primary" size="small" loading={savingEdit} disabled={!editingText.trim()} onClick={saveEdit}>
                      Save
                    </Button>
                  </Space>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ flex: 1, fontSize: 13, whiteSpace: "pre-wrap" }}>{comment.comment}</span>
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => startEdit(comment)}
                    aria-label="Edit comment"
                  />
                  <Popconfirm
                    title="Delete this comment?"
                    onConfirm={() => handleDelete(comment.id)}
                    okText="Delete"
                    cancelText="Cancel"
                  >
                    <Button danger type="text" size="small" icon={<DeleteOutlined />} aria-label="Delete comment" />
                  </Popconfirm>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
