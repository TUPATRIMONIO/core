// Shared reusable components
// Use these components across different modules (tickets, contacts, organizations, orders)

// Layout Components
export { DetailPageLayout } from "./DetailPageLayout";
export type {} from "./DetailPageLayout";

// Associations Panel
export { AssociationsPanel } from "./AssociationsPanel";
export type { AssociatedItem, AssociationSection } from "./AssociationsPanel";

// List/Table View
export { RecordListView } from "./RecordListView";
export type { ColumnDefinition, RowAction } from "./RecordListView";

// Kanban View
export { RecordKanbanView } from "./RecordKanbanView";
export type { KanbanCardProps, KanbanColumn } from "./RecordKanbanView";

// View Toggle Toolbar
export { RecordsViewToggle } from "./RecordsViewToggle";
export type { ViewMode } from "./RecordsViewToggle";
