import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { getPropertyReviews, PropertyReviewsData } from '../data/propertyReviews';
import './StudentReviews.css';

interface StudentReviewsProps {
  propertyId: string;
  propertyName?: string;
  locality?: string;
  data?: PropertyReviewsData;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export const StudentReviews: React.FC<StudentReviewsProps> = ({
  propertyId,
  propertyName = 'Student Accommodation',
  locality = 'Braamfontein',
  data: providedData
}) => {
  const [expanded, setExpanded] = useState(false);

  const data = providedData || getPropertyReviews(propertyId, propertyName, locality);
  const displayedReviews = expanded ? data.reviews : data.reviews.slice(0, 2);

  return (
    <section className="student-reviews-card card card--pad" aria-labelledby="student-reviews-title">
      {/* Header */}
      <div className="student-reviews-header">
        <h2 id="student-reviews-title" className="student-reviews-title">
          Student reviews
        </h2>
        {/* Badge removed — reviews are illustrative but badge felt cluttered */}
      </div>

      {/* Rating summary & distribution */}
      <div className="student-reviews-summary">
        <div className="student-reviews-score-col">
          <span className="student-reviews-big-score">{data.ratingFormatted}</span>
          <div className="student-reviews-star-row">
            <Star size={15} fill="var(--star, #e3a626)" stroke="none" className="student-reviews-star-icon" />
            <span className="student-reviews-star-text">{data.ratingFormatted}</span>
          </div>
          <span className="student-reviews-count-text">{data.reviewsCount} reviews</span>
        </div>

        <div className="student-reviews-bars-col">
          {data.distribution.map(b => (
            <div key={b.stars} className="student-reviews-bar-row">
              <span className="student-reviews-bar-label">{b.stars}★</span>
              <div className="student-reviews-track">
                <div
                  className="student-reviews-fill"
                  style={{ width: `${b.percent}%` }}
                  aria-label={`${b.stars} stars: ${b.percent}%`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="student-reviews-list">
        {displayedReviews.map((r, idx) => (
          <article key={idx} className="student-review-item">
            <div className="student-review-head">
              <div className="student-review-avatar" aria-hidden="true">
                {getInitials(r.author)}
              </div>
              <div className="student-review-author-info">
                <strong className="student-review-author-name">{r.author}</strong>
                <span className="student-review-date">{r.date}</span>
              </div>
              <div className="student-review-rating">
                <Star size={14} fill="var(--star, #e3a626)" stroke="none" />
                <span>{r.rating}</span>
              </div>
            </div>
            <p className="student-review-text">{r.text}</p>
          </article>
        ))}
      </div>

      {/* Read all reviews toggle button */}
      {data.reviews.length > 2 && (
        <button
          type="button"
          className="student-reviews-toggle-btn"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
        >
          {expanded ? 'Show less' : `Read all ${data.reviews.length} reviews`}
          <span className="student-reviews-toggle-arrow">{expanded ? ' ↑' : ' ↓'}</span>
        </button>
      )}
    </section>
  );
};
