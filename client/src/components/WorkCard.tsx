import React from 'react';
import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { Image } from '@client/src/components/ui/image';
import { Badge } from '@client/src/components/ui/badge';
import LikeButton from '@client/src/components/LikeButton';
import FavoriteButton from '@client/src/components/FavoriteButton';
import { useReveal } from '@client/src/hooks/useReveal';
import type { WorkListItem } from '@shared/api.interface';

interface WorkCardProps {
  work: WorkListItem;
  index?: number;
}

const WorkCard: React.FC<WorkCardProps> = ({ work }) => {
  const ref = useReveal<HTMLAnchorElement>({ threshold: 0.05 });
  return (
    <Link ref={ref} to={`/work/${work.slug}`} className="reveal group block overflow-hidden rounded-md transition-opacity hover:opacity-90" data-ai-section-type="card-list">
      <div className="aspect-[4/3] overflow-hidden rounded-md bg-muted">
        {work.coverUrl ? (
          <Image src={work.coverUrl} alt={work.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground"><span className="text-sm">无封面</span></div>
        )}
      </div>
      <div className="mt-4 space-y-2">
        {work.categories && work.categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {work.categories.slice(0, 2).map((cat) => (<Badge key={cat.id} variant="secondary" className="font-normal">{cat.name}</Badge>))}
          </div>
        )}
        <h3 className="text-lg font-semibold tracking-tight transition-colors group-hover:text-muted-foreground">{work.title}</h3>
        {work.summary && (<p className="text-sm text-muted-foreground line-clamp-2">{work.summary}</p>)}
        <div className="pt-1 flex items-center gap-4">
          <LikeButton workId={work.id} initialCount={work.likeCount || 0} size="sm" />
          <FavoriteButton workId={work.id} initialCount={work.favoriteCount || 0} size="sm" />
          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground"><Eye size={16} />{work.viewCount || 0}</span>
        </div>
      </div>
    </Link>
  );
};

export default WorkCard;
