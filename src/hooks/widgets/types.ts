"use client";

export interface WidgetState {
  id: string;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  isMinimized: boolean;
  isMaximized: boolean;
  isPinned: boolean;
  isClosed: boolean; // New: Indicates if the widget is currently closed/hidden
  previousPosition?: { x: number; y: number };
  previousSize?: { width: number; height: number };
  normalSize?: { width: number; height: number };
  normalPosition?: { x: number; y: number };
}

// Database representation of a widget state
export interface DbWidgetState {
  id?: string; // PK from DB
  user_id: string;
  widget_id: string;
  title: string;
  position_x: number;
  position_y: number;
  size_width: number;
  size_height: number;
  z_index: number;
  is_minimized: boolean;
  is_maximized: boolean;
  is_pinned: boolean;
  is_closed: boolean; // New: For DB persistence
  previous_position_x: number | null;
  previous_position_y: number | null;
  previous_size_width: number | null;
  previous_size_height: number | null;
  normal_position_x: number | null;
  normal_position_y: number | null;
  normal_size_width: number | null;
  normal_size_height: number | null;
}

export interface MainContentArea {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface WidgetConfig {
  initialPosition: { x: number; y: number };
  initialWidth: number;
  initialHeight: number;
}

export const EDGE_PADDING = 16; // Padding from the edge of the main content area

export const DOCKED_WIDGET_WIDTH = 48; // Changed to match h-12 w-12
export const DOCKED_WIDGET_HEIGHT = 48; // Changed to match h-12 w-12
export const DOCKED_WIDGET_HORIZONTAL_GAP = 4;
export const BOTTOM_DOCK_OFFSET = 16;

export const MINIMIZED_WIDGET_WIDTH = 224;
export const MINIMIZED_WIDGET_HEIGHT = 48;

export const LOCAL_STORAGE_WIDGET_STATE_KEY = 'active_widget_states';

export const clampPosition = (x: number, y: number, width: number, height: number, bounds: MainContentArea) => {
  const maxX = bounds.left + bounds.width - width - EDGE_PADDING;
  const maxY = bounds.top + bounds.height - height - EDGE_PADDING;
  const minX = bounds.left + EDGE_PADDING;
  const minY = bounds.top + EDGE_PADDING;

  const clampedX = Math.max(minX, Math.min(x, maxX));
  const clampedY = Math.max(minY, Math.min(y, maxY));
  return { x: clampedX, y: clampedY };
};

export const toDbWidgetState = (widget: WidgetState, userId: string): DbWidgetState => ({
  user_id: userId,
  widget_id: widget.id,
  title: widget.title,
  position_x: widget.position.x,
  position_y: widget.position.y,
  size_width: widget.size.width,
  size_height: widget.size.height,
  z_index: widget.zIndex,
  is_minimized: widget.isMinimized,
  is_maximized: widget.isMaximized,
  is_pinned: widget.isPinned,
  is_closed: widget.isClosed, // New
  previous_position_x: widget.previousPosition?.x ?? null,
  previous_position_y: widget.previousPosition?.y ?? null,
  previous_size_width: widget.previousSize?.width ?? null,
  previous_size_height: widget.previousSize?.height ?? null,
  normal_position_x: widget.normalPosition?.x ?? null,
  normal_position_y: widget.normalPosition?.y ?? null,
  normal_size_width: widget.normalSize?.width ?? null,
  normal_size_height: widget.normalSize?.height ?? null,
});

export const fromDbWidgetState = (dbWidget: DbWidgetState): WidgetState => ({
  id: dbWidget.widget_id,
  title: dbWidget.title,
  position: { x: dbWidget.position_x, y: dbWidget.position_y },
  size: { width: dbWidget.size_width, height: dbWidget.size_height },
  zIndex: dbWidget.z_index,
  isMinimized: dbWidget.is_minimized,
  isMaximized: dbWidget.is_maximized,
  isPinned: dbWidget.is_pinned,
  isClosed: dbWidget.is_closed, // New
  previousPosition: dbWidget.previous_position_x !== null && dbWidget.previous_position_y !== null ? { x: dbWidget.previous_position_x, y: dbWidget.previous_position_y } : undefined,
  previousSize: dbWidget.previous_size_width !== null && dbWidget.previous_size_height !== null ? { width: dbWidget.previous_size_width, height: dbWidget.previous_size_height } : undefined,
  normalPosition: dbWidget.normal_position_x !== null && dbWidget.normal_position_y !== null ? { x: dbWidget.normal_position_x, y: dbWidget.normal_position_y } : undefined,
  normalSize: dbWidget.normal_size_width !== null && dbWidget.normal_size_height !== null ? { width: dbWidget.normal_size_width, height: dbWidget.normal_size_height } : undefined,
});