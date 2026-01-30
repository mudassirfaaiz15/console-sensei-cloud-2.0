/// <reference types="vite/client" />

// Declaration for modules without type definitions
declare module 'lucide-react' {
    import { FC, SVGProps } from 'react';

    interface IconProps extends SVGProps<SVGSVGElement> {
        size?: number | string;
        color?: string;
        strokeWidth?: number | string;
    }

    export type LucideIcon = FC<IconProps>;

    export const LayoutDashboard: LucideIcon;
    export const Scan: LucideIcon;
    export const FileJson: LucideIcon;
    export const Bell: LucideIcon;
    export const Settings: LucideIcon;
    export const Cloud: LucideIcon;
    export const Menu: LucideIcon;
    export const LogOut: LucideIcon;
    export const X: LucideIcon;
    export const Server: LucideIcon;
    export const HardDrive: LucideIcon;
    export const Wifi: LucideIcon;
    export const Database: LucideIcon;
    export const Network: LucideIcon;
    export const AlertTriangle: LucideIcon;
    export const CheckCircle2: LucideIcon;
    export const XCircle: LucideIcon;
    export const Activity: LucideIcon;
    export const RefreshCw: LucideIcon;
    export const Download: LucideIcon;
    export const ShieldCheck: LucideIcon;
    export const DollarSign: LucideIcon;
    export const Shield: LucideIcon;
    export const Zap: LucideIcon;
    export const ArrowRight: LucideIcon;
    export const ArrowLeft: LucideIcon;
    export const Home: LucideIcon;
    export const User: LucideIcon;
    export const Mail: LucideIcon;
    export const Lock: LucideIcon;
    export const Eye: LucideIcon;
    export const EyeOff: LucideIcon;
    export const Loader2: LucideIcon;
    export const Sun: LucideIcon;
    export const Moon: LucideIcon;
    export const Monitor: LucideIcon;
    export const Plus: LucideIcon;
    export const Trash2: LucideIcon;
    export const Edit: LucideIcon;
    export const Save: LucideIcon;
    export const Clock: LucideIcon;
    export const Calendar: LucideIcon;
    export const Info: LucideIcon;
    export const ExternalLink: LucideIcon;
    export const ChevronDown: LucideIcon;
    export const ChevronUp: LucideIcon;
    export const ChevronLeft: LucideIcon;
    export const ChevronRight: LucideIcon;
    export const Search: LucideIcon;
    export const Filter: LucideIcon;
    export const Copy: LucideIcon;
    export const Check: LucideIcon;
    export const AlertCircle: LucideIcon;
    export const Key: LucideIcon;
    export const Globe: LucideIcon;
    export const CreditCard: LucideIcon;
    export const Palette: LucideIcon;
    export const BellRing: LucideIcon;
    export const Link: LucideIcon;
    export const Unlink: LucideIcon;
    export const Terminal: LucideIcon;
    export const Code: LucideIcon;
    export const FileText: LucideIcon;
    export const Folder: LucideIcon;
    export const FolderOpen: LucideIcon;
    export const Upload: LucideIcon;
    export const MoreHorizontal: LucideIcon;
    export const MoreVertical: LucideIcon;
    export const Sparkles: LucideIcon;
    export const TrendingUp: LucideIcon;
    export const TrendingDown: LucideIcon;
    export const BarChart2: LucideIcon;
    export const PieChart: LucideIcon;
    export const LineChart: LucideIcon;
}
