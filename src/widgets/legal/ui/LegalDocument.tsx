import { LEGAL_EFFECTIVE_DATE, type LegalSection } from "../config/constants";

export function LegalDocument({ sections }: { sections: LegalSection[] }) {
  return (
    <div className="mt-6 flex flex-col gap-8 md:mt-8">
      <p className="text-sm text-fg-muted">시행일 {LEGAL_EFFECTIVE_DATE}</p>
      {sections.map((section) => (
        <section key={section.heading} id={section.id} className="flex flex-col gap-3 scroll-mt-24">
          <h2 className="text-base font-bold text-fg-heading md:text-lg">{section.heading}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-sm leading-[1.7] text-fg-body">
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </div>
  );
}
