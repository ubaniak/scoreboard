import AddIcon from "@mui/icons-material/Add";
import CancelIcon from "@mui/icons-material/Cancel";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import SearchIcon from "@mui/icons-material/Search";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import InputAdornment from "@mui/material/InputAdornment";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Popper from "@mui/material/Popper";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import {
  ExportCsv,
  ExportPrint,
  QuickFilter,
  QuickFilterClear,
  QuickFilterControl,
  Toolbar,
  ToolbarButton,
} from "@mui/x-data-grid";
import * as React from "react";

export type AddToolbarWrapperProps = {
  children: React.ReactNode;
};

export const AddToolbarWrapper = (props: AddToolbarWrapperProps) => {
  const toolbar = React.useCallback(() => {
    return <AddToolbar>{props.children}</AddToolbar>;
  }, [props.children]);

  return toolbar;
};

export function AddToolbar(props: { children: React.ReactNode }) {
  const [newPanelOpen, setNewPanelOpen] = React.useState(false);
  const newPanelTriggerRef = React.useRef<HTMLButtonElement>(null);

  const [exportMenuOpen, setExportMenuOpen] = React.useState(false);
  const exportMenuTriggerRef = React.useRef<HTMLButtonElement>(null);

  const handleClose = () => {
    setNewPanelOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      handleClose();
    }
  };

  return (
    <Toolbar>
      <Tooltip title="Add new commodity">
        <ToolbarButton
          ref={newPanelTriggerRef}
          aria-describedby="new-panel"
          onClick={() => setNewPanelOpen((prev) => !prev)}
        >
          <AddIcon fontSize="small" />
        </ToolbarButton>
      </Tooltip>

      <Popper
        open={newPanelOpen}
        anchorEl={newPanelTriggerRef.current}
        placement="bottom-end"
        id="new-panel"
        onKeyDown={handleKeyDown}
      >
        <ClickAwayListener onClickAway={handleClose}>
          <Paper
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              width: 300,
              p: 2,
            }}
            elevation={8}
          >
            {props.children}
          </Paper>
        </ClickAwayListener>
      </Popper>

      <Tooltip title="Export">
        <ToolbarButton
          ref={exportMenuTriggerRef}
          id="export-menu-trigger"
          aria-controls="export-menu"
          aria-haspopup="true"
          aria-expanded={exportMenuOpen ? "true" : undefined}
          onClick={() => setExportMenuOpen(true)}
        >
          <FileDownloadIcon fontSize="small" />
        </ToolbarButton>
      </Tooltip>

      <Menu
        id="export-menu"
        anchorEl={exportMenuTriggerRef.current}
        open={exportMenuOpen}
        onClose={() => setExportMenuOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          list: {
            "aria-labelledby": "export-menu-trigger",
          },
        }}
      >
        <ExportPrint
          render={<MenuItem />}
          onClick={() => setExportMenuOpen(false)}
        >
          Print
        </ExportPrint>
        <ExportCsv
          render={<MenuItem />}
          onClick={() => setExportMenuOpen(false)}
        >
          Download as CSV
        </ExportCsv>
      </Menu>

      <QuickFilter>
        <QuickFilterControl
          render={({ ref, ...controlProps }, state) => (
            <TextField
              {...controlProps}
              inputRef={ref}
              aria-label="Search"
              placeholder="Search..."
              size="small"
              variant="outlined"
              sx={{ width: 250 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: state.value ? (
                  <InputAdornment position="end">
                    <QuickFilterClear
                      edge="end"
                      size="small"
                      aria-label="Clear search"
                      material={{ sx: { mr: -0.75 } }}
                    >
                      <CancelIcon fontSize="small" />
                    </QuickFilterClear>
                  </InputAdornment>
                ) : null,
              }}
            />
          )}
        />
      </QuickFilter>
    </Toolbar>
  );
}
