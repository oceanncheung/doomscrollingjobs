# Job Scoring Framework

_Date: April 1, 2026_

## 1. Scoring Goals

The ranking system should help the user spend time on the best remote design opportunities, not simply the newest or easiest jobs to find.

The model should:

- reject jobs that fail the remote requirement
- strongly prioritize quality and salary
- reward roles that match the user's real experience and portfolio
- allow adjacent design roles when fit is credible
- surface risks, red flags, and scam signals clearly
- explain why a job is ranked the way it is

## 2. Scoring Pipeline

1. Normalize the job record.
2. Apply hard filters.
3. Compute weighted factor scores for eligible jobs.
4. Apply penalties for red flags and low-trust signals.
5. Produce a final recommendation and explanation payload.

## 3. Hard Filters

Hard filters determine whether a job is even eligible for ranking.

### 3.1 Required hard filter

- **Remote eligibility**
  - Pass if the role is clearly remote or remote-first for an allowed region.
  - Fail if the role is onsite, hybrid-required, or remote wording is clearly incompatible with the user's location and work authorization.

### 3.2 Operational hard filters

These are implementation filters rather than product priorities, but they prevent bad records from entering the ranked list.

- Listing appears inactive, expired, or closed
- Application link is missing or invalid
- Job is a confirmed duplicate of another stronger source record
- Scam risk is so strong that the job should not be surfaced

Jobs that fail any hard filter should not receive an apply recommendation.

## 4. Weighted Factors

Weighted factors are applied only to jobs that pass the hard filters.

### Suggested weighted model

| Factor | Weight | Why it matters |
| --- | --- | --- |
| Quality | 35 | Strongest signal after remote; prioritizes worthwhile companies and role conditions |
| Salary | 25 | Compensation should materially influence ranking when data exists |
| Role relevance | 20 | Designer-first fit matters, but adjacent roles can still score well |
| Seniority fit | 10 | Helps avoid roles that are too junior, too senior, or misaligned |
| Portfolio fit | 5 | Important for design credibility and application strength |
| Application effort / process quality | 5 | Rewards clearer, healthier application processes |

Total possible base score: 100

## 5. Factor Definitions

### 5.1 Quality: 35 points

Quality should capture whether the opportunity is worth serious attention.

Positive signals:

- clear role scope and responsibilities
- strong brand, product, or mission fit
- evidence of design maturity or thoughtful team structure
- realistic expectations for the level
- transparent hiring process
- benefits or working conditions that indicate a healthy employer

Negative quality signals:

- vague or contradictory role description
- overly broad responsibility set for one role
- title inflation with junior compensation
- unclear reporting structure
- weak or suspicious employer presence

Suggested scoring bands:

- 30-35: excellent opportunity, high-signal employer, strong role clarity
- 20-29: solid opportunity with some unknowns
- 10-19: mixed quality, notable concerns
- 0-9: poor-quality role even if technically relevant

### 5.2 Salary: 25 points

Salary should be heavily weighted, but unknown compensation should not automatically kill a job.

Suggested interpretation:

- 22-25: strong pay relative to the user's target range
- 15-21: acceptable to good pay
- 8-14: below target but potentially viable
- 1-7: weak compensation signal
- 0: clearly below floor or exploitative

Rules:

- Use disclosed base salary when available.
- If only a range is disclosed, compare midpoint and lower bound against the user's floor and target range.
- If salary is missing, assign a neutral-to-cautious score rather than zero.
- If compensation looks commission-only, suspicious, or materially below floor, apply penalties or rejection depending on severity.

### 5.3 Role Relevance: 20 points

Role relevance measures how close the job is to the user's target work.

Suggested bands:

- 18-20: exact or near-exact target role
- 14-17: strong adjacent design role with clear transferable credibility
- 9-13: plausible stretch role with mixed fit
- 1-8: weak relevance or poor title alignment
- 0: effectively unrelated role

Adjacent roles can pass if:

- the required skills overlap meaningfully
- the portfolio can credibly support the role
- the seniority and day-to-day work still make sense for the user

### 5.4 Seniority Fit: 10 points

This checks whether the level is believable and desirable.

Positive signals:

- title and responsibility match the user's stated level
- years-of-experience expectations are close to the user's background
- leadership or execution balance matches the user's goals

Low scores:

- role is too junior
- role expects people management the user does not want
- role demands a level of product or engineering ownership beyond the user's profile

### 5.5 Portfolio Fit: 5 points

Portfolio fit matters because design hiring depends on proof, not only resume text.

Score higher when:

- the user's portfolio has directly relevant case studies
- the portfolio style matches the domain
- the role explicitly values the kind of work the user can show

Score lower when:

- required portfolio evidence is missing
- the role needs proof the current portfolio does not support

### 5.6 Application Effort / Process Quality: 5 points

This rewards jobs with healthier, clearer application processes.

Positive signals:

- direct employer application flow
- reasonable questions
- clear timeline or expectations
- no excessive unpaid work upfront

Low scores:

- highly repetitive ATS entry with little upside
- unclear third-party recruiter handoff
- excessive friction relative to role quality

## 6. Red Flags And Penalties

Red flags reduce the score after weighted factors are calculated.

### Suggested penalty model

| Severity | Penalty | Examples |
| --- | --- | --- |
| Minor | -3 to -5 | vague salary, unclear team structure, light duplication concerns |
| Moderate | -6 to -12 | misleading title, unrealistic scope, agency repost with poor detail |
| Severe | -13 to -25 | exploitative pay, contradictory remote language, heavy low-trust signals |

Possible red flags:

- role says "remote" but requires frequent onsite presence
- unrealistic combination of responsibilities
- title/scope mismatch
- repeated reposting without clarity
- poor grammar plus vague company identity
- staffing agency listing with little employer transparency
- excessive unpaid test work expectation
- low-quality job description with little design context

## 7. Scam And Low-Quality Signals

Scam detection should be conservative and explicit.

### High-risk scam signals

- request for payment, training fees, or equipment purchase
- off-domain email communication for a major company
- crypto, gift-card, or banking requests
- urgent interview or offer process with little verification
- broken company footprint or impossible compensation claims

### Low-quality trust signals

- no salary or benefits context for a senior role
- recruiter post with no company disclosure
- inconsistent location or employment details
- no credible web presence
- application flow that feels mass-harvested rather than legitimate

Guidance:

- High-confidence scam signals should trigger hard rejection.
- Lower-confidence trust issues should reduce score and appear in the explanation.

## 8. Suggested Final Score Formula

For eligible jobs:

`final_score = quality + salary + role_relevance + seniority_fit + portfolio_fit + effort_score - penalties`

Recommendation bands:

- `85+` -> Strong Apply
- `70-84` -> Apply If Interested
- `55-69` -> Consider Carefully
- `<55` -> Skip Unless Special Context

Important:

- A passed remote gate is required before any recommendation above `Skip`.
- Jobs with missing salary can still rank well if quality and fit are exceptional.
- Adjacent roles should not outrank designer-first roles unless their overall fit is genuinely stronger.

## 9. Explanation Output Contract

Every scored job should produce a structured explanation with:

- `remote_gate_passed`
- `total_score`
- `recommendation_level`
  - `strong_apply`
  - `apply_if_interested`
  - `consider_carefully`
  - `skip`
- `factor_breakdown`
  - quality
  - salary
  - role relevance
  - seniority fit
  - portfolio fit
  - application effort
- `top_reasons`
- `missing_requirements`
- `red_flags`
- `scam_risk_level`
- `summary`

Example explanation themes:

- why the role is a strong fit
- where the salary stands relative to the user's targets
- whether the role is exact-fit or adjacent-fit
- which portfolio items should support the application
- what concerns should be reviewed before applying

## 10. Implementation Notes

- Keep the remote gate deterministic wherever possible.
- Separate data normalization from scoring so scores remain explainable.
- Store component scores instead of only the final total.
- Prefer conservative classification when data is ambiguous.
- Revisit weights only after enough labeled examples exist to compare ranking quality.
