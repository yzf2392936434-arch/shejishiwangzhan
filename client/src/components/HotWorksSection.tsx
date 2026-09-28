import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import WorkCard from '@client/src/components/WorkCard';
import type { WorkListItem } from '@shared/api.interface';

interface HotWorksSectionProps {
  hotWorks: WorkListItem[];
  title?: string;
}

const HotWorksSection: React.FC<HotWorksSectionProps> = ({ hotWorks, title }) => {
  if (!hotWorks || hotWorks.length === 0) return null;
  return (
    <section className="max-w-7xl mx-auto px-6 md:px-8 py-20 md:py-32 border-t border-border">
      <div className="flex items-end justify-between mb-10 md:mb-16">
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold">{title || '热门作品'}</h2>
          <p className="mt-2 text-muted-foreground">综合热度最高的设计作品</p>
        </div>
        <Link to="/works" className="inline-flex items-center gap-1 text-sm font-medium text-foreground hover:text-muted-foreground transition-colors">
          查看全部 <ArrowRight size={14} />
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8" data-ai-section-type="card-list">
        {hotWorks.map((work) => (<WorkCard key={work.id} work={work} />))}
      </div>
    </section>
  );
};

export default HotWorksSection;
