/**
 * Derives the Risk Score for a review based on its sentiment and language.
 * Possible values: 'Low Risk', 'Medium Risk', 'High Risk'.
 * 
 * @param {object} row - The review analysis result
 * @returns {string}
 */
export function getRiskScore(row) {
  if (row.error) return 'N/A';
  const sentiment = row.sentiment;
  const text = (row.review || '').toLowerCase();
  
  if (sentiment === 'Positive') {
    return 'Low Risk';
  }
  
  if (sentiment === 'Neutral') {
    const mediumRiskTriggers = ["unprofessional", "slow", "delay", "poor", "dirty", "smell", "noisy", "loud", "expensive", "wait"];
    const hasTrigger = mediumRiskTriggers.some(word => text.includes(word));
    return hasTrigger ? 'Medium Risk' : 'Low Risk';
  }
  
  if (sentiment === 'Negative') {
    const highRiskTriggers = ["terrible", "worst", "dirty", "ruined", "disaster", "danger", "unprofessional", "rude", "cancel", "refund", "never", "charge", "stole", "smell", "scam", "leak", "bug", "insect", "broken", "cheated", "liar"];
    const hasTrigger = highRiskTriggers.some(word => text.includes(word)) || text.length > 80;
    return hasTrigger ? 'High Risk' : 'Medium Risk';
  }
  
  return 'Low Risk';
}

/**
 * Determines the Priority Score for management action based on the theme and sentiment.
 * Possible values: 'Low Priority', 'Medium Priority', 'High Priority'.
 * 
 * @param {object} row - The review analysis result
 * @returns {string}
 */
export function getPriorityScore(row) {
  if (row.error) return 'N/A';
  const sentiment = row.sentiment;
  const theme = row.theme;
  
  if (sentiment === 'Positive') {
    return 'Low Priority';
  }
  
  if (sentiment === 'Neutral') {
    if (theme === 'Cleanliness' || theme === 'Host') {
      return 'Medium Priority';
    }
    return 'Low Priority';
  }
  
  if (sentiment === 'Negative') {
    if (theme === 'Cleanliness' || theme === 'Host' || theme === 'Value') {
      return 'High Priority';
    }
    return 'Medium Priority';
  }
  
  return 'Low Priority';
}

/**
 * Dynamically generates a concise, professional AI review digest from analysis results.
 * 
 * @param {Array} reviews - The list of analyzed reviews
 * @returns {string|null}
 */
export function generateReviewDigest(reviews) {
  if (!reviews || reviews.length === 0) return null;
  const validReviews = reviews.filter(r => !r.error);
  if (validReviews.length === 0) return null;

  const total = validReviews.length;
  const positive = validReviews.filter(r => r.sentiment === 'Positive');
  const negative = validReviews.filter(r => r.sentiment === 'Negative');
  const neutral = validReviews.filter(r => r.sentiment === 'Neutral');

  // Group by theme and sentiment
  const themeSentiments = {};
  validReviews.forEach(r => {
    if (!themeSentiments[r.theme]) {
      themeSentiments[r.theme] = { Positive: 0, Negative: 0, Neutral: 0 };
    }
    themeSentiments[r.theme][r.sentiment]++;
  });

  // Sort themes by positive counts
  const positiveThemes = Object.keys(themeSentiments)
    .filter(t => themeSentiments[t].Positive > 0)
    .sort((a, b) => themeSentiments[b].Positive - themeSentiments[a].Positive);

  // Sort themes by negative counts
  const negativeThemes = Object.keys(themeSentiments)
    .filter(t => themeSentiments[t].Negative > 0)
    .sort((a, b) => themeSentiments[b].Negative - themeSentiments[a].Negative);

  // Map theme codes to readable management-friendly phrases
  const themePhrasesPos = {
    Host: 'the host\'s exceptional hospitality',
    Location: 'the scenic and peaceful location',
    Cleanliness: 'the pristine cleanliness of the property',
    Food: 'the quality and taste of the food',
    Value: 'the excellent value for money',
    Experience: 'the overall stay experience'
  };

  const themePhrasesNeg = {
    Host: 'host responsiveness and service',
    Location: 'location accessibility or surrounding noise',
    Cleanliness: 'room cleanliness and maintenance issues',
    Food: 'food preparation or dining service speed',
    Value: 'pricing value relative to expectations',
    Experience: 'unmet expectations regarding facilities'
  };

  let praisePart = '';
  if (positiveThemes.length > 0) {
    const topThemes = positiveThemes.slice(0, 2).map(t => themePhrasesPos[t] || t.toLowerCase());
    if (topThemes.length === 1) {
      praisePart = `Guests consistently highlighted ${topThemes[0]} as a major strength of their stay.`;
    } else {
      praisePart = `Guests consistently praised ${topThemes[0]} and ${topThemes[1]}.`;
    }
  }

  let concernPart = '';
  if (negativeThemes.length > 0) {
    const topThemes = negativeThemes.slice(0, 2).map(t => themePhrasesNeg[t] || t.toLowerCase());
    if (topThemes.length === 1) {
      concernPart = `Recurring concerns were related to ${topThemes[0]}.`;
    } else {
      concernPart = `Recurring concerns were raised regarding ${topThemes[0]} and ${topThemes[1]}.`;
    }
  } else if (neutral.length > 0) {
    concernPart = `A few minor observations were noted, suggesting small areas for improvement.`;
  }

  // Combine into digest
  if (positive.length === total) {
    return `Feedback is overwhelmingly positive. ${praisePart} No major issues or areas of concern were reported.`;
  } else if (negative.length === total) {
    return `Critical management attention is required. ${concernPart} Urgent corrective action is recommended to address these guest complaints.`;
  } else {
    return `${praisePart} ${concernPart}`.trim();
  }
}

/**
 * Groups analyzed reviews dynamically into clusters based on their theme.
 * 
 * @param {Array} reviews - The list of analyzed reviews
 * @returns {Array<{theme: string, name: string, count: number, dominantSentiment: string, colorClass: string}>}
 */
export function getReviewClusters(reviews) {
  if (!reviews || reviews.length === 0) return [];
  const validReviews = reviews.filter(r => !r.error);
  if (validReviews.length === 0) return [];

  // Group reviews by theme
  const groups = {};
  validReviews.forEach(r => {
    if (!groups[r.theme]) {
      groups[r.theme] = [];
    }
    groups[r.theme].push(r);
  });

  const clusters = Object.keys(groups).map(theme => {
    const themeReviews = groups[theme];
    const posCount = themeReviews.filter(r => r.sentiment === 'Positive').length;
    const negCount = themeReviews.filter(r => r.sentiment === 'Negative').length;
    
    // Determine dominant sentiment
    let dominantSentiment = 'Neutral';
    let colorClass = 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300';
    
    if (posCount > negCount && posCount >= themeReviews.length / 2) {
      dominantSentiment = 'Positive';
      colorClass = 'bg-emerald-50/60 border-emerald-200/50 text-emerald-800 hover:bg-emerald-50';
    } else if (negCount > posCount && negCount >= themeReviews.length / 3) {
      // Negatives have higher weight in cluster severity
      dominantSentiment = 'Negative';
      colorClass = 'bg-rose-50/60 border-rose-200/50 text-rose-800 hover:bg-rose-50';
    } else if (themeReviews.some(r => r.sentiment === 'Neutral')) {
      dominantSentiment = 'Neutral';
      colorClass = 'bg-amber-50/60 border-amber-200/50 text-amber-800 hover:bg-amber-50';
    }

    // Determine cluster name mapping dynamically
    let name = `${theme} Experience`;
    if (theme === 'Host') {
      name = dominantSentiment === 'Positive' ? 'Host Hospitality' : dominantSentiment === 'Negative' ? 'Host Service Issues' : 'Host Communication';
    } else if (theme === 'Cleanliness') {
      name = dominantSentiment === 'Positive' ? 'Cleanliness Excellence' : dominantSentiment === 'Negative' ? 'Cleanliness Issues' : 'Property Upkeep';
    } else if (theme === 'Location') {
      name = dominantSentiment === 'Positive' ? 'Location Advantages' : dominantSentiment === 'Negative' ? 'Location Accessibility' : 'Location Experience';
    } else if (theme === 'Food') {
      name = dominantSentiment === 'Positive' ? 'Dining Highlights' : dominantSentiment === 'Negative' ? 'Food Quality Issues' : 'Food & Beverage';
    } else if (theme === 'Value') {
      name = dominantSentiment === 'Positive' ? 'Pricing Satisfaction' : dominantSentiment === 'Negative' ? 'Value Concerns' : 'Value Evaluation';
    } else if (theme === 'Experience') {
      name = dominantSentiment === 'Positive' ? 'General Satisfaction' : dominantSentiment === 'Negative' ? 'Experience Deficits' : 'Overall Experience';
    }

    return {
      theme,
      name,
      count: themeReviews.length,
      dominantSentiment,
      colorClass
    };
  });

  // Sort by count descending
  return clusters.sort((a, b) => b.count - a.count);
}
