import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@client/src/components/ui/button';

interface NotFoundState {
  type?: 'work-offline' | 'default';
  title?: string;
  message?: string;
}

const NotFound: React.FC = () => {
  const location = useLocation();
  const state = (location.state || {}) as NotFoundState;
  const isWorkOffline = state.type === 'work-offline';

  const title = state.title || (isWorkOffline ? '作品已下线' : '页面不存在');
  const message =
    state.message ||
    (isWorkOffline
      ? '抱歉，您访问的作品不存在或已被移除。'
      : '抱歉，您访问的页面不存在或已被移除。');

  return (
    <section className="max-w-7xl mx-auto px-6 md:px-8 py-20 md:py-32">
      <div className="flex flex-col items-center text-center space-y-8">
        <div className="space-y-4">
          <p className="text-6xl md:text-8xl font-bold tracking-tight text-foreground">
            404
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold">{title}</h1>
          <p className="text-base text-muted-foreground max-w-md">{message}</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Button asChild>
            <Link to="/">返回首页</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/works">查看作品</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default NotFound;
