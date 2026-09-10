import type { WidgetType, PortfolioSection } from "../store/widgets";

export interface Section {
  id: string;
  label: string;
  group: string;
  routes?: string[];
  pages?: string[];
  rollup?: boolean;
}

export interface WidgetDefinition {
  type: WidgetType;
  label: string;
  shortcut?: string;
  defaultSize: { w: number; h: number };
  symbolAware?: boolean;
  provider: string;
  sections?: PortfolioSection[];
}

const sections: Section[] = [];
const widgets: WidgetDefinition[] = [];

export function RegisterSection(section: Section): void {
  sections.push(section);
}

export function RegisterWidget(widget: WidgetDefinition): void {
  widgets.push(widget);
}

export function getSections(): readonly Section[] {
  return sections;
}

export function getWidgets(): readonly WidgetDefinition[] {
  return widgets;
}
