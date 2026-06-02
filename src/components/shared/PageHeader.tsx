interface PageHeaderProps {
    heading: string;
    description?: string;
    children?: React.ReactNode;
}

export function PageHeader({ heading, description, children }: PageHeaderProps) {
    return (
        <div className="flex items-center justify-between pb-4 border-b border-border/40">
            <div className="space-y-0.5">
                <h2 className="text-xl font-bold tracking-tight text-foreground">{heading}</h2>
                {description && (
                    <p className="text-sm text-muted-foreground">{description}</p>
                )}
            </div>
            {children && (
                <div className="flex items-center space-x-2">{children}</div>
            )}
        </div>
    );
}
