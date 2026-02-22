interface PageTemplateProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  /** Optional: for tutorial mini-window anchoring */
  dataTutorialId?: string
}

export function PageTemplate({ title, subtitle, children, dataTutorialId }: PageTemplateProps) {
  return (
    <div className="space-y-6">
      <div {...(dataTutorialId ? { 'data-tutorial': dataTutorialId } : {})}>
        <h1 className="font-aldrich text-3xl font-bold text-gray-900 mb-2">{title}</h1>
        {subtitle && (
          <p className="font-alumni text-base text-gray-600 max-w-2xl">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  )
}
