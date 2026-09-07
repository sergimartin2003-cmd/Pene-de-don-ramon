import Reveal from "@/components/site/Reveal";

type Props = {
  index: string;
  eyebrow: string;
  title: React.ReactNode;
  intro?: string;
  action?: React.ReactNode;
};

export default function SectionHeading({ index, eyebrow, title, intro, action }: Props) {
  return (
    <Reveal className="hairline pt-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="label flex items-center gap-3 text-stone">
            <span className="text-ember">{index}</span>
            {eyebrow}
          </p>
          <h2 className="display-lg mt-5 text-balance">{title}</h2>
          {intro && <p className="mt-5 max-w-lg text-pretty text-stone">{intro}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </Reveal>
  );
}
