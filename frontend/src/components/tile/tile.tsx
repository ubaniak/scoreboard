import { MoreVert } from "@mui/icons-material";
import {
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useState } from "react";

interface MenuAction {
  label: string;
  onClick: () => void;
  dividerAbove?: boolean;
}

export type ShowCardProps = {
  header?: string;
  children: React.ReactNode;
  menuItems?: MenuAction[];
};

export const Tile = (props: ShowCardProps) => {
  const menuItems = props.menuItems || [];

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleMenuClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAnchorEl(null);
  };

  return (
    <>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Stack
          direction="row"
          spacing={2}
          divider={<Divider orientation="vertical" flexItem />}
          justifyContent="space-between"
        >
          <Typography variant="h6">{props.header}</Typography>
          {menuItems.length > 0 && (
            <IconButton size="small" onClick={handleMenuOpen} sx={{}}>
              <MoreVert fontSize="small" />
            </IconButton>
          )}
        </Stack>
        {props.children}
      </Paper>
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
              item.onClick();
              handleMenuClose(e);
            }}
          >
            {item.label}
          </MenuItem>,
        ])}
      </Menu>
    </>
  );
};
