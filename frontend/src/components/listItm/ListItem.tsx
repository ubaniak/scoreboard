// components/ToolboxListItem.tsx
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Typography,
  Avatar,
} from "@mui/material";
import { MoreVert } from "@mui/icons-material";
import { type ReactNode, useState } from "react";

interface MenuAction {
  label: string;
  onClick: (id: string) => void;
  dividerAbove?: boolean;
}

interface ToolboxListItemProps {
  id: string;
  primary: string | ReactNode;
  secondary?: string | ReactNode;
  icon?: ReactNode;
  selected?: boolean;
  onClick?: () => void;

  menuItems?: MenuAction[];
  children?: ReactNode;
}

export default function ToolboxListItem({
  id,
  primary,
  secondary,
  icon,
  selected = false,
  onClick,
  menuItems = [],
  children,
}: ToolboxListItemProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleMenuClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAnchorEl(null);
  };

  const renderPrimary = () =>
    typeof primary === "string" ? (
      <Typography variant="body1" fontWeight={600} color="text.primary">
        {primary}
      </Typography>
    ) : (
      primary
    );

  const renderSecondary = () =>
    !secondary ? null : typeof secondary === "string" ? (
      <Typography variant="body2" color="text.secondary">
        {secondary}
      </Typography>
    ) : (
      secondary
    );

  return (
    <>
      <Box
        onClick={onClick}
        sx={{
          borderRadius: 2,
          mb: 0.5,
          position: "relative",
          cursor: onClick ? "pointer" : "default",
          transition: "all 0.2s ease",
          "&:hover": {
            bgcolor: (t) =>
              t.palette.mode === "dark"
                ? "rgba(255,255,255,0.08)"
                : "rgba(0,0,0,0.04)",
          },
          ...(selected && {
            bgcolor: (t) =>
              t.palette.mode === "dark"
                ? "rgba(30,58,95,0.24)"
                : "rgba(30,58,95,0.12)",
            "&:hover": {
              bgcolor: (t) =>
                t.palette.mode === "dark"
                  ? "rgba(30,58,95,0.32)"
                  : "rgba(30,58,95,0.16)",
            },
          }),
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            px: 3,
            py: 2.5,
            gap: 2,
          }}
        >
          {children}

          <Box sx={{ width: 40, height: 40, flexShrink: 0 }}>
            <Avatar
              sx={{
                bgcolor: "primary.main",
                width: 40,
                height: 40,
                color: "white",
              }}
            >
              {icon ?? <div />}
            </Avatar>
          </Box>

          {/* Text */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {renderPrimary()}
            {renderSecondary() && (
              <Box sx={{ mt: 0.5 }}>{renderSecondary()}</Box>
            )}
          </Box>

          {/* More menu */}
          {menuItems.length > 0 && (
            <IconButton
              size="small"
              onClick={handleMenuOpen}
              sx={{
                opacity: 0,
                transition: "opacity 0.2s",
                "&:hover": { bgcolor: "action.hover" },
                "*:hover > &": { opacity: 0.6 },
                ...(selected && { opacity: 0.6 }),
              }}
            >
              <MoreVert fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
        PaperProps={{ sx: { borderRadius: 2, minWidth: 180 } }}
      >
        {menuItems.map((item, i) => [
          item.dividerAbove && <Divider key={`d-${i}`} />,
          <MenuItem
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              item.onClick(id);
              handleMenuClose(e);
            }}
          >
            {item.label}
          </MenuItem>,
        ])}
      </Menu>
    </>
  );
}
