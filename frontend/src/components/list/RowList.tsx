import { Skeleton, Typography } from "antd";
import { radius, space, useTheme } from "../../theme";

export type RowListColumn<T> = {
  key: string;
  width: string;
  title?: string;
  render: (record: T) => React.ReactNode;
};

export type RowListProps<T> = {
  data: T[];
  rowKey: (record: T) => React.Key;
  columns: RowListColumn<T>[];
  loading?: boolean;
  emptyText?: React.ReactNode;
  rowWarning?: (record: T) => boolean;
};

const THUMBNAIL_HUES = [217, 262, 12, 190, 32, 152];

const initialAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${THUMBNAIL_HUES[Math.abs(hash) % THUMBNAIL_HUES.length]}, 55%, 45%)`;
};

export const RowThumbnail = ({ name, imageUrl }: { name: string; imageUrl?: string }) => {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt=""
        style={{ width: 40, height: 40, borderRadius: radius.sm, objectFit: "cover" }}
      />
    );
  }
  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: radius.sm,
        background: initialAvatarColor(name),
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
};

export const RowList = <T,>(props: RowListProps<T>) => {
  const { colors } = useTheme();

  if (props.loading) {
    return <Skeleton active paragraph={{ rows: 6 }} />;
  }

  if (props.data.length === 0) {
    return (
      <Typography.Text
        type="secondary"
        style={{ display: "block", padding: `${space.lg}px 0`, textAlign: "center" }}
      >
        {props.emptyText ?? "No records found."}
      </Typography.Text>
    );
  }

  const gridTemplateColumns = props.columns.map((c) => c.width).join(" ");
  const hasHeader = props.columns.some((c) => c.title);

  return (
    <div
      style={{
        background: colors.bgElevated,
        border: `1px solid ${colors.borderSubtle}`,
        borderRadius: radius.lg,
        boxShadow: colors.shadowSm,
        overflow: "hidden",
        overflowX: "auto",
      }}
    >
      {hasHeader && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns,
            gap: space.md,
            padding: `8px ${space.md}px`,
            borderBottom: `1px solid ${colors.borderSubtle}`,
            minWidth: "fit-content",
          }}
        >
          {props.columns.map((column) => (
            <span
              key={column.key}
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: colors.textFaint,
              }}
            >
              {column.title}
            </span>
          ))}
        </div>
      )}
      {props.data.map((record, i) => {
        const warning = props.rowWarning?.(record) ?? false;
        return (
          <div
            key={props.rowKey(record)}
            style={{
              display: "grid",
              gridTemplateColumns,
              alignItems: "center",
              gap: space.md,
              padding: `12px ${space.md}px`,
              borderBottom: i === props.data.length - 1 ? "none" : `1px solid ${colors.borderSubtle}`,
              minWidth: "fit-content",
              background: warning ? "rgba(250, 204, 21, 0.12)" : undefined,
              boxShadow: warning ? "inset 3px 0 0 0 rgba(234, 179, 8, 0.8)" : undefined,
            }}
          >
            {props.columns.map((column) => (
              <div key={column.key}>{column.render(record)}</div>
            ))}
          </div>
        );
      })}
    </div>
  );
};
