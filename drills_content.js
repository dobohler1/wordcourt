/* WordCourt drills — original practice sets, auto-graded. Content only; UI in drills.js.
   Item types: numeric (typed answer), mc (A–E), completion (ISEE sentence completion), analogy (bridge first),
   reading (passage-linked), checklist (platform review, self-marked), card (read-only). */
window.WORDCOURT_DRILLS = {
  skills: {
    'scale-area': 'Scaling: area × k²', 'scale-volume': 'Scaling: volume × k³', 'lcm-product': 'LCM vs. least product',
    'stats-median-grouped': 'Median from table / histogram', 'stats-weighted-mean': 'Weighted mean', 'stats-mean-median-effect': 'Changes to mean vs. median',
    'stats-mean': 'Mean', 'answer-asked': 'Answer the question asked', 'chart-read': 'Reading a chart', 'percent-chain': 'Percent change chains',
    'perimeter-area': 'Perimeter / area setup', 'rate-time': 'Rate × time, unit slips', 'venn': 'Overlapping sets', 'reverse-percent': 'Reverse percentage',
    'speed-range': 'Average-speed bounds', 'segment-algebra': 'Segment addition algebra', 'function-notation': 'Function notation f(x+a)',
    'cube-packing': 'Cubes in a cube', 'prob-mult': 'Probability: multiply', 'prob-noreplace': 'Probability without replacement',
    'revenue-balance': 'Revenue balance', 'estimation': 'Estimation direction', 'sign-reversal': 'Reversed difference / sign',
    'spatial-view': 'Views of solids', 'triangle-area': 'Triangle area', 'sum-series': 'Sums of consecutive integers', 'factors': 'Factors (1 counts)',
    'qc-algebra': 'QC: simplify both columns', 'qc-boundary': 'QC: boundary > vs ≥', 'qc-label': 'QC: compare the right group', 'qc-not-to-scale': 'QC: not drawn to scale',
    'polygon-angles': 'Polygon angle formula', 'counting-pairs': 'Counting pairs / handshakes', 'negatives-magnitude': 'Negatives: magnitude vs. value',
    'qc-assumed-similarity': 'QC: unstated similarity', 'qc-one-case': 'QC: one case is not proof', 'grid-area': 'Area on a grid', 'radicals': 'Radicals',
    'fraction-zero': 'Fraction = 0 (numerator only)', 'unit-conversion': 'Unit conversion', 'inequality-translate': 'Number line → inequality',
    'imaginary': 'Imaginary numbers', 'distance-formula': 'Distance formula', 'gcf': 'GCF of monomials', 'sequence-explicit': 'Explicit nth term',
    'coordinate-geometry': 'Coordinate geometry', 'rational-equation': 'Rational equations', 'trig-ratio': 'Trig ratios (SOH-CAH-TOA)',
    'rd-main-idea': 'Reading: main idea (not too narrow)', 'rd-detail': 'Reading: detail (re-find the line)', 'rd-relationship': 'Reading: reversed relationship',
    'rd-tone': 'Reading: tone / attitude', 'rd-inference': 'Reading: inference (not anti-thesis)', 'rd-century': 'Reading: century / date arithmetic',
    'rd-vocab': 'Reading: vocabulary in context', 'rd-purpose': 'Reading: paragraph purpose', 'rd-sequence': 'Reading: sequence of events',
    'percent-of': 'Percent of a number / finding the whole', 'rd-pacing': 'Reading: pacing (reached in time)', 'vocab-completion': 'Sentence completions', 'analogy-bridge': 'Analogy bridges', 'timed': 'Timed section pacing',
  },

  sets: [
    /* ==================== LESSONS · mastery checks ==================== */
    {
      "id": "lesson1_percent_check",
      "day": "Lessons · Core Concepts",
      "availableFrom": "2026-09-02",
      "order": 1,
      "title": "Lesson 1 · Percent Is a Multiplier — mastery check",
      "subtitle": "5 questions · 8 minutes · take after the lesson",
      "scoring": "isee",
      "timeLimitS": 480,
      "intro": [
        {
          "type": "directions",
          "html": "<b>Mastery check.</b> Five questions, eight minutes, no notes. Each question has four suggested answers; select the best one and answer every question. Four of five or better means the concept is in."
        }
      ],
      "items": [
        {
          "id": "pm1",
          "type": "mc",
          "skills": [
            "percent-of"
          ],
          "prompt": "What is 35% of 60?",
          "choices": [
            [
              "A",
              "21"
            ],
            [
              "B",
              "24"
            ],
            [
              "C",
              "25"
            ],
            [
              "D",
              "35"
            ]
          ],
          "answer": "A",
          "explain": "$0.35 \\times 60 = 21$."
        },
        {
          "id": "pm2",
          "type": "mc",
          "skills": [
            "reverse-percent"
          ],
          "prompt": "After a 40% discount, a tent costs \\$72. What was the original price?",
          "choices": [
            [
              "A",
              "\\$100.80"
            ],
            [
              "B",
              "\\$115.20"
            ],
            [
              "C",
              "\\$120"
            ],
            [
              "D",
              "\\$180"
            ]
          ],
          "answer": "C",
          "explain": "40% off leaves 60%: $72 \\div 0.60 = 120$. Choice (A) multiplies by 1.4, which applies the percent to the wrong amount."
        },
        {
          "id": "pm3",
          "type": "mc",
          "skills": [
            "percent-chain"
          ],
          "prompt": "A price rises 10% and then falls 10%. What is the net change?",
          "choices": [
            [
              "A",
              "No change"
            ],
            [
              "B",
              "A decrease of 1%"
            ],
            [
              "C",
              "An increase of 1%"
            ],
            [
              "D",
              "A decrease of 20%"
            ]
          ],
          "answer": "B",
          "explain": "$1.10 \\times 0.90 = 0.99$: down 1%. The 10% drop was taken from a larger number than the 10% rise was added to."
        },
        {
          "id": "pm4",
          "type": "mc",
          "skills": [
            "percent-of",
            "reverse-percent"
          ],
          "prompt": "48 is 60% of what number?",
          "choices": [
            [
              "A",
              "28.8"
            ],
            [
              "B",
              "80"
            ],
            [
              "C",
              "108"
            ],
            [
              "D",
              "8"
            ]
          ],
          "answer": "B",
          "explain": "The whole is missing: $48 \\div 0.60 = 80$."
        },
        {
          "id": "pm5",
          "type": "mc",
          "skills": [
            "reverse-percent"
          ],
          "prompt": "After a 20% raise, an employee earns \\$30,000 per year. What was the salary before the raise?",
          "choices": [
            [
              "A",
              "\\$24,000"
            ],
            [
              "B",
              "\\$25,000"
            ],
            [
              "C",
              "\\$36,000"
            ],
            [
              "D",
              "\\$28,000"
            ]
          ],
          "answer": "B",
          "explain": "A raise makes the multiplier 1.20: $30{,}000 \\div 1.20 = 25{,}000$. Choice (A) multiplies by 0.80, treating 20% of the new salary as the raise."
        }
      ]
    },
    {
      "id": "lesson2_probability_check",
      "day": "Lessons · Core Concepts",
      "availableFrom": "2026-09-02",
      "order": 2,
      "title": "Lesson 2 · Probability — mastery check",
      "subtitle": "5 questions · 8 minutes · take after the lesson",
      "scoring": "isee",
      "timeLimitS": 480,
      "intro": [
        {
          "type": "directions",
          "html": "<b>Mastery check.</b> Five questions, eight minutes, no notes. Each question has four suggested answers; select the best one and answer every question. Four of five or better means the concept is in."
        }
      ],
      "items": [
        {
          "id": "pb1",
          "type": "mc",
          "skills": [
            "prob-mult"
          ],
          "prompt": "A spinner has 12 equal sections numbered 1 through 12. It is spun twice. What is the probability that both spins land on a multiple of 5?",
          "choices": [
            [
              "A",
              "$\\tfrac{1}{6}$"
            ],
            [
              "B",
              "$\\tfrac{1}{36}$"
            ],
            [
              "C",
              "$\\tfrac{1}{3}$"
            ],
            [
              "D",
              "$\\tfrac{1}{12}$"
            ]
          ],
          "answer": "B",
          "explain": "Multiples of 5: 5 and 10, so $\\tfrac{2}{12} = \\tfrac{1}{6}$ per spin. Both: $\\tfrac{1}{6} \\times \\tfrac{1}{6} = \\tfrac{1}{36}$. Choice (A) is one spin only."
        },
        {
          "id": "pb2",
          "type": "mc",
          "skills": [
            "prob-noreplace",
            "prob-mult"
          ],
          "prompt": "A bag holds 5 red and 3 blue marbles. Two marbles are drawn without replacement. What is the probability that both are blue?",
          "choices": [
            [
              "A",
              "$\\tfrac{9}{64}$"
            ],
            [
              "B",
              "$\\tfrac{3}{28}$"
            ],
            [
              "C",
              "$\\tfrac{3}{8}$"
            ],
            [
              "D",
              "$\\tfrac{6}{8}$"
            ]
          ],
          "answer": "B",
          "explain": "$\\tfrac{3}{8} \\times \\tfrac{2}{7} = \\tfrac{6}{56} = \\tfrac{3}{28}$. Choice (A) assumes replacement."
        },
        {
          "id": "pb3",
          "type": "mc",
          "skills": [
            "prob-mult"
          ],
          "prompt": "A box contains 4 green and 6 yellow tokens. One token is drawn and returned, then a second token is drawn. Which expression gives the probability that both tokens are yellow?",
          "choices": [
            [
              "A",
              "$\\tfrac{6}{10} \\times \\tfrac{6}{10}$"
            ],
            [
              "B",
              "$\\tfrac{6}{10} \\times \\tfrac{5}{9}$"
            ],
            [
              "C",
              "$\\tfrac{3}{5}$"
            ],
            [
              "D",
              "$\\tfrac{6}{10} + \\tfrac{6}{10}$"
            ]
          ],
          "answer": "A",
          "explain": "Returned means the second draw has the same probability: $\\tfrac{6}{10}$ twice, multiplied. Choice (B) is without replacement; choice (D) adds."
        },
        {
          "id": "pb4",
          "type": "mc",
          "skills": [
            "qc-boundary"
          ],
          "prompt": "Pieces of paper numbered 6 through 13 are placed in a hat. One is drawn at random. What is the probability that the number is greater than 10?",
          "choices": [
            [
              "A",
              "$\\tfrac{3}{8}$"
            ],
            [
              "B",
              "$\\tfrac{3}{7}$"
            ],
            [
              "C",
              "$\\tfrac{4}{8}$"
            ],
            [
              "D",
              "$\\tfrac{3}{13}$"
            ]
          ],
          "answer": "A",
          "explain": "Papers 6 through 13 are eight numbers. Greater than 10: 11, 12, 13. $\\tfrac{3}{8}$. Choice (B) miscounts the sample space as 7; choice (C) includes 10."
        },
        {
          "id": "pb5",
          "type": "mc",
          "skills": [
            "prob-mult"
          ],
          "prompt": "A fair coin is flipped three times. What is the probability of at least one tail?",
          "choices": [
            [
              "A",
              "$\\tfrac{1}{8}$"
            ],
            [
              "B",
              "$\\tfrac{3}{8}$"
            ],
            [
              "C",
              "$\\tfrac{1}{2}$"
            ],
            [
              "D",
              "$\\tfrac{7}{8}$"
            ]
          ],
          "answer": "D",
          "explain": "No tails at all (three heads) is $\\tfrac{1}{8}$; at least one tail is $1 - \\tfrac{1}{8} = \\tfrac{7}{8}$."
        }
      ]
    },
    {
      "id": "lesson3_statistics_check",
      "day": "Lessons · Core Concepts",
      "availableFrom": "2026-09-02",
      "order": 3,
      "title": "Lesson 3 · Mean, Median, and Data in Tables — mastery check",
      "subtitle": "5 questions · 8 minutes · take after the lesson",
      "scoring": "isee",
      "timeLimitS": 480,
      "intro": [
        {
          "type": "directions",
          "html": "<b>Mastery check.</b> Five questions, eight minutes, no notes. Each question has four suggested answers; select the best one and answer every question. Four of five or better means the concept is in."
        }
      ],
      "items": [
        {
          "id": "st1",
          "type": "mc",
          "skills": [
            "stats-median-grouped"
          ],
          "prompt": "The table shows the hours of sleep reported by 13 students. What is the median?<table class=\"dtable\"><tr><th>Hours</th><td>6</td><td>7</td><td>8</td><td>9</td></tr><tr><th>Students</th><td>2</td><td>4</td><td>5</td><td>2</td></tr></table>",
          "choices": [
            [
              "A",
              "7"
            ],
            [
              "B",
              "7.5"
            ],
            [
              "C",
              "8"
            ],
            [
              "D",
              "8.5"
            ]
          ],
          "answer": "C",
          "explain": "$n = 13$, position 7. Running total 2, 6, 11, 13. Position 7 falls in the \"8\" column."
        },
        {
          "id": "st2",
          "type": "mc",
          "skills": [
            "stats-mean"
          ],
          "prompt": "Six test scores have a mean of 80. Five of the scores are 72, 85, 90, 78, and 80. What is the sixth score?",
          "choices": [
            [
              "A",
              "75"
            ],
            [
              "B",
              "80"
            ],
            [
              "C",
              "81"
            ],
            [
              "D",
              "95"
            ]
          ],
          "answer": "A",
          "explain": "Total $= 80 \\times 6 = 480$; the five known add to 405; $480 - 405 = 75$."
        },
        {
          "id": "st3",
          "type": "mc",
          "skills": [
            "stats-weighted-mean"
          ],
          "prompt": "Three quiz scores are 70, 80, and 90. A project counts twice as much as a quiz. What project score raises the overall mean by 4 points?",
          "choices": [
            [
              "A",
              "84"
            ],
            [
              "B",
              "88"
            ],
            [
              "C",
              "90"
            ],
            [
              "D",
              "96"
            ]
          ],
          "answer": "C",
          "explain": "Current mean 80, target 84. Total weight $3 + 2 = 5$: $\\dfrac{240 + 2x}{5} = 84 \\Rightarrow 2x = 180 \\Rightarrow x = 90$."
        },
        {
          "id": "st4",
          "type": "mc",
          "skills": [
            "stats-mean-median-effect"
          ],
          "prompt": "Fifteen values have a mean of 50 and a median of 48. The largest value is increased by 30. Which is true of the new mean and median?",
          "choices": [
            [
              "A",
              "Mean 52, median 48"
            ],
            [
              "B",
              "Mean 52, median 50"
            ],
            [
              "C",
              "Mean 50, median 48"
            ],
            [
              "D",
              "Mean 80, median 48"
            ]
          ],
          "answer": "A",
          "explain": "Total up 30 over 15 values: mean up 2. The largest value was already above the middle and stays there: median unchanged."
        },
        {
          "id": "st5",
          "type": "mc",
          "skills": [
            "stats-median-grouped"
          ],
          "prompt": "A histogram shows 20 values: six 1s, four 2s, four 3s, and six 4s. What is the median?",
          "choices": [
            [
              "A",
              "2"
            ],
            [
              "B",
              "2.5"
            ],
            [
              "C",
              "3"
            ],
            [
              "D",
              "3.5"
            ]
          ],
          "answer": "B",
          "explain": "$n = 20$, positions 10 and 11. Running total 6, 10, 14, 20. Position 10 is the last 2; position 11 is the first 3. Median $= (2 + 3) \\div 2 = 2.5$."
        }
      ]
    },
    /* ==================== DAY 1 ==================== */
    {
      id: 'sep1_d1_warmup', day: 'Day 1 · Tue Sept 1', availableFrom: '2026-09-01', order: 10,
      title: 'Warm-Up', subtitle: '3 questions · typed answers', scoring: 'none', timeLimitS: null,
      items: [
        { id: 'd1w1', type: 'numeric', skills: ['scale-volume'], prompt: 'The radius and the height of a cylinder are both doubled. The volume of the cylinder is multiplied by what number?', answer: '8',
          explain: '$V = \\pi r^2 h$. Doubling $r$ multiplies $V$ by $2^2 = 4$; doubling $h$ multiplies by 2; together $4 \\times 2 = 8$. All three dimensions double, so volume scales by $2^3$.' },
        { id: 'd1w2', type: 'numeric', skills: ['scale-area'], prompt: 'The radius of a sphere is multiplied by 4. The surface area of the sphere is multiplied by what number?', answer: '16',
          explain: 'Surface area is a two-dimensional measure: it scales by the square of the length factor, $4^2 = 16$.' },
        { id: 'd1w3', type: 'numeric', skills: ['lcm-product'], prompt: '$x$ is a positive multiple of 6 and $y$ is a positive multiple of 10. What is the least possible value of the product $xy$?', answer: '60',
          explain: 'The least positive multiple of 6 is 6 and of 10 is 10; the least product is $6 \\times 10 = 60$. The least common multiple (30) answers a different question.' },
      ],
    },
    {
      id: 'sep1_d1_stats', day: 'Day 1 · Tue Sept 1', availableFrom: '2026-09-01', order: 20,
      title: 'Statistics from Grouped Data', subtitle: 'ISEE rules · 2 worked examples + 4 questions', scoring: 'isee', timeLimitS: null,
      intro: [
        { type: 'directions', html: '<b>Directions:</b> Read the two worked examples, then answer the four questions that follow. Each question has four suggested answers. Select the best answer.' },
        { type: 'reference', title: 'Reference — Median and Mean from a Table or Histogram', html: 'A histogram or frequency table is a compressed list. To find the <b>median</b>, decompress it: count how many values there are in total ($n$), locate the middle position — the $\\tfrac{n+1}{2}$th value when $n$ is odd, the average of the $\\tfrac{n}{2}$th and $\\left(\\tfrac{n}{2}+1\\right)$th values when $n$ is even — and count up through the bars or rows until that position is reached. The median is a <i>data value</i> (a bar\'s label), never the middle of the axis and never the average of the labels.<br>For the <b>mean</b>, multiply each value by its frequency, add, and divide by $n$. A score that "counts twice" has a weight of 2: it is added twice to the numerator and adds 2 to the denominator.' },
        { type: 'example', title: 'Worked Example 1 — median and mean from a frequency table', html: 'The table shows the number of pets in each of 15 households.<table class="dtable"><tr><th>Pets</th><td>0</td><td>1</td><td>2</td><td>3</td><td>4</td></tr><tr><th>Households</th><td>4</td><td>5</td><td>3</td><td>2</td><td>1</td></tr></table><i>Median.</i> $n = 15$, so the median is the 8th value. Counting up: the "0" row covers positions 1–4; the "1" row covers positions 5–9. Position 8 falls in the "1" row. <b>Median = 1.</b><br><i>Mean.</i> $\\dfrac{0(4)+1(5)+2(3)+3(2)+4(1)}{15} = \\dfrac{21}{15} = 1.4$. The mean (1.4) and the median (1) are different questions with different answers — check which one is asked.' },
        { type: 'example', title: 'Worked Example 2 — a weighted mean with an unknown', html: 'A student\'s four test scores are 82, 90, 78, and 86. The final exam counts twice as much as one test. What final-exam score gives the student an overall mean of 85?<br>Total weight $= 4 + 2 = 6$. The required total is $85 \\times 6 = 510$. The tests contribute $82+90+78+86 = 336$. So $336 + 2x = 510$, giving $2x = 174$ and $x = 87$.<br>Check: $\\dfrac{336 + 2(87)}{6} = \\dfrac{510}{6} = 85$ ✓ — the final counts twice in the numerator <i>and</i> twice in the denominator.' },
      ],
      items: [
        { id: 'd1s1', type: 'mc', skills: ['stats-median-grouped'], figure: 'hist_books',
          prompt: 'The histogram shows the number of books read over the summer by the 24 students in a class. What is the median number of books read?',
          choices: [['A', '1'], ['B', '2'], ['C', '2.5'], ['D', '3']], answer: 'B',
          explain: '$n = 24$, so the median is the average of the 12th and 13th values. Cumulative counts: 0 books → positions 1–3; 1 book → 4–8; 2 books → 9–15. Both the 12th and 13th values are 2. Choice (C) is the middle of the axis; neither (C) nor (D) is a data value in the middle position.' },
        { id: 'd1s2', type: 'mc', skills: ['stats-median-grouped'],
          prompt: 'The table shows the years of service of the 11 employees of a company. What is the median number of years of service?<table class="dtable"><tr><th>Years of service</th><td>1</td><td>3</td><td>5</td><td>8</td><td>12</td></tr><tr><th>Number of employees</th><td>2</td><td>3</td><td>2</td><td>3</td><td>1</td></tr></table>',
          choices: [['A', '3'], ['B', '5'], ['C', '5.8'], ['D', '6.5']], answer: 'B',
          explain: '$n = 11$, median is the 6th value. Cumulative: 1 yr → 1–2; 3 yr → 3–5; 5 yr → 6–7. The 6th value is 5. Choice (C) is the average of the five labels, which is not a statistic of the data.' },
        { id: 'd1s3', type: 'mc', skills: ['stats-weighted-mean'],
          prompt: 'A student\'s four quiz scores are 75, 83, 91, and 79. The project counts twice as much as one quiz. What project score is needed for an overall mean of 84?',
          choices: [['A', '84'], ['B', '86'], ['C', '88'], ['D', '92']], answer: 'C',
          explain: 'Total weight $4 + 2 = 6$; required total $84 \\times 6 = 504$; quizzes contribute $75+83+91+79 = 328$; $2x = 176$, $x = 88$.' },
        { id: 'd1s4', type: 'mc', skills: ['stats-mean-median-effect'],
          prompt: 'A set of 20 test scores has a mean of 78 and a median of 80. Two students whose scores were below the median retake the test, and each raises his or her score by 10 points, but both scores remain below the median. Which of the following describes the new mean and median?',
          choices: [['A', 'The mean is 79 and the median is 80.'], ['B', 'The mean is 79 and the median is 81.'], ['C', 'The mean is 78 and the median is 80.'], ['D', 'The mean is 80 and the median is 80.']], answer: 'A',
          explain: 'The total rises by $2 \\times 10 = 20$ points over 20 scores, so the mean rises by 1, to 79. Both changed scores stay below the median, so the ordered list\'s middle values are unchanged: the median stays 80.' },
      ],
    },
    {
      id: 'sep1_d1_multistep', day: 'Day 1 · Tue Sept 1', availableFrom: '2026-09-01', order: 30,
      title: 'Multi-Step Problems', subtitle: 'SSAT rules · 6 questions · 12 minutes', scoring: 'ssat', timeLimitS: 720,
      intro: [
        { type: 'directions', html: '<b>Directions:</b> Following each problem there are five suggested answers. Work each problem on scratch paper, then decide which answer is best. <b>Scoring:</b> +1 correct, −¼ incorrect, 0 blank.' },
        { type: 'reference', title: 'Strategy Reference — Answer the Question Asked', html: 'After computing, re-read the <b>last sentence</b> of the question and check that the number found is the thing it asks for. The most common final steps that get skipped: subtracting from a total, combining two categories, converting the unit, finding the <i>other</i> variable, and multiplying the quantity just found. The intermediate number is almost always one of the answer choices.' },
      ],
      items: [
        { id: 'd1m1', type: 'mc', skills: ['chart-read', 'answer-asked'], figure: 'pie_lunch',
          prompt: '<i>Questions 1 and 2 refer to the chart.</i><br>What fraction of the students chose pizza or salad?',
          choices: [['A', '$\\tfrac{7}{20}$'], ['B', '$\\tfrac{47}{100}$'], ['C', '$\\tfrac{12}{25}$'], ['D', '$\\tfrac{53}{100}$'], ['E', '$\\tfrac{3}{5}$']], answer: 'B',
          explain: 'Pizza or salad $= 35\\% + 12\\% = 47\\% = \\tfrac{47}{100}$. Choice (A) is pizza alone.' },
        { id: 'd1m2', type: 'mc', skills: ['chart-read', 'answer-asked'],
          prompt: 'How many more students chose tacos than chose soup?',
          choices: [['A', '16'], ['B', '17'], ['C', '34'], ['D', '50'], ['E', '66']], answer: 'C',
          explain: 'Tacos minus soup $= 25\\% - 8\\% = 17\\%$ of 200 students $= 34$ students. Choice (B) is the difference in percentage points, not in students; choice (D) is the number who chose tacos.' },
        { id: 'd1m3', type: 'mc', skills: ['answer-asked'],
          prompt: 'If $\\tfrac{1}{4}a + \\tfrac{1}{4}b = 6$, what is the value of $5a + 5b$?',
          choices: [['A', '24'], ['B', '30'], ['C', '96'], ['D', '120'], ['E', '150']], answer: 'D',
          explain: '$\\tfrac{1}{4}(a+b) = 6 \\Rightarrow a + b = 24 \\Rightarrow 5(a+b) = 120$. Choice (A) is $a+b$, the intermediate step.' },
        { id: 'd1m4', type: 'mc', skills: ['percent-chain', 'answer-asked'],
          prompt: 'A theater sold 480 tickets on Friday. On Saturday it sold 15% more tickets than on Friday, and on Sunday it sold 60 fewer tickets than on Saturday. How many tickets were sold on Sunday?',
          choices: [['A', '420'], ['B', '492'], ['C', '540'], ['D', '552'], ['E', '612']], answer: 'B',
          explain: 'Saturday $= 480 \\times 1.15 = 552$; Sunday $= 552 - 60 = 492$. Choice (D) is Saturday\'s count.' },
        { id: 'd1m5', type: 'mc', skills: ['perimeter-area', 'answer-asked'],
          prompt: 'The perimeter of a rectangle is 54 centimeters, and its length is 5 centimeters more than its width. What is the area of the rectangle, in square centimeters?',
          choices: [['A', '11'], ['B', '16'], ['C', '27'], ['D', '176'], ['E', '352']], answer: 'D',
          explain: '$2(w + w + 5) = 54 \\Rightarrow 2w + 5 = 27 \\Rightarrow w = 11$, length 16; area $= 11 \\times 16 = 176$. Choices (A) and (B) are the dimensions.' },
        { id: 'd1m6', type: 'mc', skills: ['rate-time'],
          prompt: 'A runner completes 3 laps of a track in 4 minutes 30 seconds. At the same pace, how long will it take the runner to complete 5 laps?',
          choices: [['A', '6 minutes 00 seconds'], ['B', '7 minutes 00 seconds'], ['C', '7 minutes 30 seconds'], ['D', '7 minutes 50 seconds'], ['E', '8 minutes 30 seconds']], answer: 'C',
          explain: '4 min 30 s $= 270$ s; per lap $270 \\div 3 = 90$ s; five laps $= 450$ s $= 7$ min 30 s. Choice (D) comes from reading 7.5 minutes as 7:50.' },
      ],
    },
    {
      "id": "sep1_d1_review",
      "day": "Day 1 · Tue Sept 1",
      "availableFrom": "2026-09-01",
      "order": 40,
      "title": "Review Set",
      "subtitle": "7 questions · multi-step and grouped-data statistics · ISEE rules",
      "scoring": "isee",
      "timeLimitS": null,
      "intro": [
        {
          "type": "directions",
          "html": "<b>Directions:</b> Each question has four or five suggested answers. Work each problem on scratch paper, then select the best answer. Answer every question. After computing, re-read the last sentence of the question before choosing."
        }
      ],
      "items": [
        {
          "id": "d1rv1",
          "type": "mc",
          "skills": [
            "chart-read",
            "answer-asked"
          ],
          "prompt": "A student recorded how a full day was spent: sleeping 35%, school 25%, homework 12%, sports 8%, other 20%. What fractional part of the day was spent sleeping or playing sports?",
          "choices": [
            [
              "A",
              "$\\tfrac{7}{20}$"
            ],
            [
              "B",
              "$\\tfrac{43}{100}$"
            ],
            [
              "C",
              "$\\tfrac{12}{25}$"
            ],
            [
              "D",
              "$\\tfrac{3}{5}$"
            ],
            [
              "E",
              "$\\tfrac{9}{25}$"
            ]
          ],
          "answer": "B",
          "explain": "Sleeping or sports $= 35\\% + 8\\% = 43\\% = \\tfrac{43}{100}$. Choice (A) is sleeping alone — the question asks for both categories combined."
        },
        {
          "id": "d1rv2",
          "type": "mc",
          "skills": [
            "chart-read",
            "answer-asked"
          ],
          "prompt": "Using the same record (sleeping 35%, school 25%, homework 12%, sports 8%, other 20%): if 96 minutes were spent on homework, what was the difference between the number of minutes spent at school and the number of minutes spent on sports?",
          "choices": [
            [
              "A",
              "136"
            ],
            [
              "B",
              "200"
            ],
            [
              "C",
              "64"
            ],
            [
              "D",
              "264"
            ],
            [
              "E",
              "96"
            ]
          ],
          "answer": "A",
          "explain": "Homework is 12%, so the whole record is $96 \\div 0.12 = 800$ minutes. School $= 0.25 \\times 800 = 200$; sports $= 0.08 \\times 800 = 64$; difference $= 136$. Choices (B) and (C) are the two quantities before subtracting."
        },
        {
          "id": "d1rv3",
          "type": "mc",
          "skills": [
            "estimation"
          ],
          "prompt": "The table shows the prices of six items. What is the best estimate of the total cost of the six items?<table class=\"dtable\"><tr><th>Item</th><td>notebook</td><td>pen set</td><td>eraser</td><td>binder</td><td>ruler</td><td>markers</td></tr><tr><th>Price</th><td>\\$1.95</td><td>\\$3.10</td><td>\\$0.89</td><td>\\$4.05</td><td>\\$2.15</td><td>\\$5.90</td></tr></table>",
          "choices": [
            [
              "A",
              "\\$15"
            ],
            [
              "B",
              "\\$16"
            ],
            [
              "C",
              "\\$18"
            ],
            [
              "D",
              "\\$20"
            ],
            [
              "E",
              "\\$22"
            ]
          ],
          "answer": "C",
          "explain": "Round each price to the nearest dollar: $2 + 3 + 1 + 4 + 2 + 6 = 18$. Rounding each item once, in the right direction, keeps the estimate close (the exact total is \\$18.04)."
        },
        {
          "id": "d1rv4",
          "type": "mc",
          "skills": [
            "answer-asked"
          ],
          "prompt": "If $\\tfrac{1}{5}m + \\tfrac{1}{5}n = 3$, what is the value of $4m + 4n$?",
          "choices": [
            [
              "A",
              "15"
            ],
            [
              "B",
              "20"
            ],
            [
              "C",
              "60"
            ],
            [
              "D",
              "12"
            ]
          ],
          "answer": "C",
          "explain": "Multiply by 5: $m + n = 15$. The question asks for $4(m + n) = 60$. Choice (A) is the intermediate value $m + n$."
        },
        {
          "id": "d1rv5",
          "type": "mc",
          "skills": [
            "stats-median-grouped"
          ],
          "prompt": "The table shows the number of pets owned by each of 21 students. What is the median number of pets?<table class=\"dtable\"><tr><th>Pets</th><td>0</td><td>1</td><td>2</td><td>3</td><td>4</td></tr><tr><th>Students</th><td>4</td><td>7</td><td>5</td><td>3</td><td>2</td></tr></table>",
          "choices": [
            [
              "A",
              "1"
            ],
            [
              "B",
              "1.5"
            ],
            [
              "C",
              "2"
            ],
            [
              "D",
              "2.5"
            ]
          ],
          "answer": "A",
          "explain": "$n = 21$, median is the 11th value. Cumulative: 0 pets → positions 1–4; 1 pet → 5–11. The 11th value is 1. Choice (C) is the middle of the label axis, not the middle of the data."
        },
        {
          "id": "d1rv6",
          "type": "mc",
          "skills": [
            "stats-weighted-mean"
          ],
          "prompt": "A student's four quiz scores are 78, 84, 90, and 88. The final exam counts twice as much as a quiz. What final-exam score raises the student's mean by 2 points?",
          "choices": [
            [
              "A",
              "87"
            ],
            [
              "B",
              "89"
            ],
            [
              "C",
              "91"
            ],
            [
              "D",
              "93"
            ]
          ],
          "answer": "C",
          "explain": "Current mean $= 340 \\div 4 = 85$; target 87. Total weight 6, required total $87 \\times 6 = 522$; $340 + 2x = 522 \\Rightarrow x = 91$."
        },
        {
          "id": "d1rv7",
          "type": "mc",
          "skills": [
            "stats-median-grouped"
          ],
          "prompt": "The frequency table shows the number of customers each of 11 employees helped in one hour. What is the median number of customers helped?<table class=\"dtable\"><tr><th>Customers helped</th><td>2</td><td>3</td><td>5</td><td>7</td></tr><tr><th>Employees</th><td>2</td><td>3</td><td>4</td><td>2</td></tr></table>",
          "choices": [
            [
              "A",
              "4"
            ],
            [
              "B",
              "4.25"
            ],
            [
              "C",
              "5"
            ],
            [
              "D",
              "6"
            ]
          ],
          "answer": "C",
          "explain": "$n = 11$, median is the 6th value. Cumulative: 2 → 1–2; 3 → 3–5; 5 → 6–9. The 6th value is 5. Choice (B) averages the labels, which is not a statistic of the data."
        }
      ]
    },

    /* ==================== DAY 2 ==================== */
    {
      id: 'sep1_d2_warmup', day: 'Day 2 · Wed Sept 2', availableFrom: '2026-09-02', order: 50,
      title: 'Warm-Up', subtitle: '3 questions · typed answers', scoring: 'none', timeLimitS: null,
      items: [
        { id: 'd2w1', type: 'numeric', skills: ['scale-volume'], prompt: 'The edge of a cube is multiplied by 5. The volume of the cube is multiplied by what number?', answer: '125',
          explain: 'Volume scales by the cube of the length factor: $5^3 = 125$.' },
        { id: 'd2w2', type: 'numeric', skills: ['answer-asked'], prompt: 'If $2x + 2y = 18$, what is the average (arithmetic mean) of $x$ and $y$?', answer: '4.5', accept: ['9/2', '4 1/2'],
          explain: '$x + y = 9$; the mean is $\\tfrac{x+y}{2} = 4.5$. The sum is the intermediate step, not the answer.' },
        { id: 'd2w3', type: 'numeric', skills: ['prob-mult'], prompt: 'A spinner has 8 equal sections numbered 1 through 8. It is spun twice. What is the probability that both spins land on a prime number? (Enter a fraction such as 3/8.)', answer: '1/4', accept: ['0.25', '.25', '2/8', '25%'],
          explain: 'Primes from 1 to 8: 2, 3, 5, 7, so $P(\\text{prime}) = \\tfrac{4}{8} = \\tfrac{1}{2}$ on each spin; both: $\\tfrac{1}{2} \\times \\tfrac{1}{2} = \\tfrac{1}{4}$.' },
      ],
    },
    {
      id: 'sep1_d2_quant', day: 'Day 2 · Wed Sept 2', availableFrom: '2026-09-02', order: 60,
      title: 'Quantitative Mini-Section', subtitle: 'SSAT rules · 10 questions · 10 minutes · timed', scoring: 'ssat', timeLimitS: 600,
      intro: [{ type: 'directions', html: '<b>Directions:</b> The timer starts when you press Begin. Following each problem there are five suggested answers. Work each problem on scratch paper, then decide which answer is best. <b>Scoring:</b> +1 correct, −¼ incorrect, 0 blank. Leave a question blank unless you have worked it or eliminated at least two choices. When time runs out the section submits itself.' }],
      items: [
        { id: 'd2q1', type: 'mc', skills: ['venn'], prompt: 'In a class of 30 students, 18 play soccer and 15 play basketball. If 5 students play neither sport, how many students play both?',
          choices: [['A', '3'], ['B', '5'], ['C', '8'], ['D', '10'], ['E', '13']], answer: 'C',
          explain: 'Students in at least one sport $= 30 - 5 = 25$. Then $18 + 15 - \\text{both} = 25$, so both $= 8$.' },
        { id: 'd2q2', type: 'mc', skills: ['reverse-percent'], prompt: 'After a 20% discount, a jacket costs \\$68. What was the original price of the jacket?',
          choices: [['A', '\\$54.40'], ['B', '\\$81.60'], ['C', '\\$85.00'], ['D', '\\$88.00'], ['E', '\\$136.00']], answer: 'C',
          explain: 'The sale price is 80% of the original: $0.80x = 68 \\Rightarrow x = 85$. Choice (B) adds 20% to the sale price, which undoes nothing.' },
        { id: 'd2q3', type: 'mc', skills: ['speed-range'], prompt: 'A car travels 210 miles in more than 3 hours but less than 3½ hours. The car\'s average speed, in miles per hour, must be between',
          choices: [['A', '50 and 60'], ['B', '60 and 70'], ['C', '65 and 75'], ['D', '70 and 80'], ['E', '75 and 85']], answer: 'B',
          explain: '$210 \\div 3.5 = 60$ and $210 \\div 3 = 70$; the speed lies between 60 and 70 mph. The longer the time, the lower the speed.' },
        { id: 'd2q4', type: 'mc', skills: ['segment-algebra', 'answer-asked'], prompt: 'Points $A$, $B$, and $C$ lie on a line in that order. If $AC = 30$, $BC = x + 4$, and $AB = 2x - 1$, what is the length of $AB$?',
          choices: [['A', '9'], ['B', '13'], ['C', '17'], ['D', '21'], ['E', '27']], answer: 'C',
          explain: '$AB + BC = AC$: $(2x - 1) + (x + 4) = 30 \\Rightarrow 3x = 27 \\Rightarrow x = 9$. The question asks for $AB = 2(9) - 1 = 17$. Choice (A) is $x$; choice (B) is $BC$.' },
        { id: 'd2q5', type: 'mc', skills: ['function-notation'], prompt: 'If $g(x - 3) = 4x + 1$, what is the value of $g(2)$?',
          choices: [['A', '9'], ['B', '13'], ['C', '17'], ['D', '21'], ['E', '25']], answer: 'D',
          explain: 'Solve the argument first: $x - 3 = 2 \\Rightarrow x = 5$. Then $g(2) = 4(5) + 1 = 21$. Choice (A) substitutes 2 for $x$ directly.' },
        { id: 'd2q6', type: 'mc', skills: ['cube-packing', 'scale-volume'], prompt: 'How many cubes with edges of length 2 centimeters can be packed, with no space left over, inside a cube with edges of length 8 centimeters?',
          choices: [['A', '4'], ['B', '16'], ['C', '32'], ['D', '64'], ['E', '512']], answer: 'D',
          explain: '$8 \\div 2 = 4$ small cubes along each edge; $4^3 = 64$. Choice (B) is $4^2$; choice (A) is the edge ratio alone.' },
        { id: 'd2q7', type: 'mc', skills: ['prob-noreplace', 'prob-mult'], prompt: 'A bag contains 3 red marbles and 5 blue marbles. Two marbles are drawn at random, one after the other, without replacement. What is the probability that both marbles are red?',
          choices: [['A', '$\\tfrac{3}{64}$'], ['B', '$\\tfrac{3}{28}$'], ['C', '$\\tfrac{9}{64}$'], ['D', '$\\tfrac{3}{8}$'], ['E', '$\\tfrac{3}{4}$']], answer: 'B',
          explain: 'Without replacement: $\\tfrac{3}{8} \\times \\tfrac{2}{7} = \\tfrac{6}{56} = \\tfrac{3}{28}$. Choice (C) assumes replacement.' },
        { id: 'd2q8', type: 'mc', skills: ['revenue-balance', 'answer-asked'], prompt: 'A store sells 500 notebooks at \\$4 each. If the price is raised to \\$5 each, how many fewer notebooks must the store sell to take in the same amount of money?',
          choices: [['A', '20'], ['B', '80'], ['C', '100'], ['D', '400'], ['E', '500']], answer: 'C',
          explain: 'Revenue $= 500 \\times 4 = 2000$ dollars. At \\$5 each, $2000 \\div 5 = 400$ notebooks; the question asks how many <i>fewer</i>: $500 - 400 = 100$. Choice (D) is the new count.' },
        { id: 'd2q9', type: 'mc', skills: ['estimation'], prompt: 'The value of $4.9 \\times 19.8 + 3.02 \\times 9.9$ is closest to',
          choices: [['A', '100'], ['B', '115'], ['C', '127'], ['D', '135'], ['E', '148']], answer: 'C',
          explain: '$4.9 \\times 19.8$ is just under $5 \\times 20 = 100$ (it is 97.02), and $3.02 \\times 9.9$ is just under 30 (it is 29.9). The total is about 127. Rounding both products up gives 130; tracking the rounding direction (both rounded up) confirms the answer is below 130.' },
        { id: 'd2q10', type: 'mc', skills: ['perimeter-area', 'answer-asked'], prompt: 'The area of a square is 144 square centimeters. A rectangle has a length twice the side of the square and a width half the side of the square. What is the perimeter of the rectangle, in centimeters?',
          choices: [['A', '30'], ['B', '48'], ['C', '60'], ['D', '144'], ['E', '288']], answer: 'C',
          explain: 'Side $= \\sqrt{144} = 12$. Length 24, width 6; perimeter $= 2(24 + 6) = 60$. Choice (D) is the square\'s area, choice (B) the square\'s perimeter.' },
      ],
    },
    {
      "id": "sep1_d2_review_ssat",
      "day": "Day 2 · Wed Sept 2",
      "availableFrom": "2026-09-02",
      "order": 70,
      "title": "Review A — SSAT Quantitative",
      "subtitle": "13 questions · SSAT rules · 15 minutes",
      "scoring": "ssat",
      "timeLimitS": 900,
      "intro": [
        {
          "type": "directions",
          "html": "<b>Directions:</b> Following each problem there are five suggested answers. Work each problem on scratch paper, then decide which answer is best. <b>Scoring:</b> +1 correct, −¼ incorrect, 0 blank."
        }
      ],
      "items": [
        {
          "id": "rvs1",
          "type": "mc",
          "skills": [
            "speed-range"
          ],
          "prompt": "A bus took between 2½ and 3 hours to make a 150-mile trip. The average speed of the bus, in miles per hour, must be between which range of values?",
          "choices": [
            [
              "A",
              "40 and 50"
            ],
            [
              "B",
              "50 and 60"
            ],
            [
              "C",
              "55 and 65"
            ],
            [
              "D",
              "60 and 70"
            ],
            [
              "E",
              "70 and 80"
            ]
          ],
          "answer": "B",
          "explain": "$150 \\div 3 = 50$ and $150 \\div 2.5 = 60$. The longer time gives the lower speed, so the speed is between 50 and 60 mph."
        },
        {
          "id": "rvs2",
          "type": "mc",
          "skills": [
            "prob-mult"
          ],
          "prompt": "Events $P$, $Q$, and $R$ are independent. If $P(P) = 0.5$, $P(Q) = 0.3$, and $P(R) = 0.2$, what is the probability that all three events occur?",
          "choices": [
            [
              "A",
              "0.03"
            ],
            [
              "B",
              "0.1"
            ],
            [
              "C",
              "0.3"
            ],
            [
              "D",
              "0.5"
            ],
            [
              "E",
              "1.0"
            ]
          ],
          "answer": "A",
          "explain": "\"And\" for independent events means multiply: $0.5 \\times 0.3 \\times 0.2 = 0.03$. Choice (E) adds the probabilities."
        },
        {
          "id": "rvs3",
          "type": "mc",
          "skills": [
            "cube-packing",
            "scale-volume"
          ],
          "prompt": "A large cube has a volume of 512 cubic inches. How many small cubes with a side length of 4 inches can fit inside the large cube?",
          "choices": [
            [
              "A",
              "128"
            ],
            [
              "B",
              "64"
            ],
            [
              "C",
              "16"
            ],
            [
              "D",
              "8"
            ],
            [
              "E",
              "4"
            ]
          ],
          "answer": "D",
          "explain": "$512 = 8^3$, so the large cube's side is 8 in. Two small cubes fit along each edge: $2 \\times 2 \\times 2 = 8$. Choice (A) divides 512 by 4 instead of by $4^3$."
        },
        {
          "id": "rvs4",
          "type": "mc",
          "skills": [
            "function-notation"
          ],
          "prompt": "If $h(x - 1) = 5x + 2$ for all values of $x$, what is the value of $h(3)$?",
          "choices": [
            [
              "A",
              "17"
            ],
            [
              "B",
              "22"
            ],
            [
              "C",
              "12"
            ],
            [
              "D",
              "27"
            ],
            [
              "E",
              "7"
            ]
          ],
          "answer": "B",
          "explain": "Solve the argument first: $x - 1 = 3 \\Rightarrow x = 4$. Then $h(3) = 5(4) + 2 = 22$. Choice (A) substitutes 3 for $x$ directly."
        },
        {
          "id": "rvs5",
          "type": "mc",
          "skills": [
            "chart-read",
            "answer-asked"
          ],
          "prompt": "A day was divided as follows: sleeping 30%, school 25%, homework 10%, sports 5%, other 30%. What fractional part of the day was spent sleeping or playing sports?",
          "choices": [
            [
              "A",
              "$\\tfrac{3}{10}$"
            ],
            [
              "B",
              "$\\tfrac{7}{20}$"
            ],
            [
              "C",
              "$\\tfrac{1}{20}$"
            ],
            [
              "D",
              "$\\tfrac{2}{5}$"
            ],
            [
              "E",
              "$\\tfrac{3}{5}$"
            ]
          ],
          "answer": "B",
          "explain": "$30\\% + 5\\% = 35\\% = \\tfrac{7}{20}$. Choice (A) is sleeping alone."
        },
        {
          "id": "rvs6",
          "type": "mc",
          "skills": [
            "chart-read",
            "answer-asked"
          ],
          "prompt": "Using the same division of the day (sleeping 30%, school 25%, homework 10%, sports 5%, other 30%): if 60 minutes were spent on sports, what was the difference between the number of minutes spent sleeping and the number spent on homework?",
          "choices": [
            [
              "A",
              "240"
            ],
            [
              "B",
              "360"
            ],
            [
              "C",
              "120"
            ],
            [
              "D",
              "300"
            ],
            [
              "E",
              "480"
            ]
          ],
          "answer": "A",
          "explain": "Sports is 5%, so the whole day recorded is $60 \\div 0.05 = 1200$ minutes. Sleeping $= 360$, homework $= 120$, difference $= 240$. Choices (B) and (C) stop before subtracting."
        },
        {
          "id": "rvs7",
          "type": "mc",
          "skills": [
            "venn"
          ],
          "prompt": "In a survey, each of 300 students plays the piano, the guitar, or both. If 210 play the piano and 150 play the guitar, how many play both?",
          "choices": [
            [
              "A",
              "60"
            ],
            [
              "B",
              "90"
            ],
            [
              "C",
              "150"
            ],
            [
              "D",
              "240"
            ],
            [
              "E",
              "360"
            ]
          ],
          "answer": "A",
          "explain": "Overlapping groups: $\\text{piano} + \\text{guitar} - \\text{both} = \\text{total}$, so $210 + 150 - x = 300$ and $x = 60$. Choice (B) is $300 - 210$."
        },
        {
          "id": "rvs8",
          "type": "mc",
          "skills": [
            "estimation"
          ],
          "prompt": "The table shows the prices of six items. What is the best estimate of the total cost?<table class=\"dtable\"><tr><th>Price</th><td>\\$2.89</td><td>\\$0.95</td><td>\\$4.12</td><td>\\$1.05</td><td>\\$3.79</td><td>\\$6.15</td></tr></table>",
          "choices": [
            [
              "A",
              "\\$15"
            ],
            [
              "B",
              "\\$17"
            ],
            [
              "C",
              "\\$19"
            ],
            [
              "D",
              "\\$21"
            ],
            [
              "E",
              "\\$23"
            ]
          ],
          "answer": "C",
          "explain": "Round each to the nearest dollar: $3 + 1 + 4 + 1 + 4 + 6 = 19$ (exact total \\$18.95)."
        },
        {
          "id": "rvs9",
          "type": "mc",
          "skills": [
            "revenue-balance",
            "answer-asked"
          ],
          "prompt": "A bakery sells an average of 800 muffins per day at \\$1.50 each. It plans to raise the price to \\$2.00. After the increase, how many fewer muffins can the bakery sell per day for daily sales to stay the same?",
          "choices": [
            [
              "A",
              "100"
            ],
            [
              "B",
              "200"
            ],
            [
              "C",
              "400"
            ],
            [
              "D",
              "600"
            ],
            [
              "E",
              "1,200"
            ]
          ],
          "answer": "B",
          "explain": "Current daily sales $= 800 \\times 1.50 = \\$1200$. At \\$2.00 each, $1200 \\div 2 = 600$ muffins. The question asks how many fewer: $800 - 600 = 200$. Choice (D) is the new count."
        },
        {
          "id": "rvs10",
          "type": "mc",
          "skills": [
            "venn"
          ],
          "prompt": "Each of 80 students owns a bicycle, a skateboard, or both. If 55 own a bicycle and 40 own a skateboard, how many own both?",
          "choices": [
            [
              "A",
              "15"
            ],
            [
              "B",
              "25"
            ],
            [
              "C",
              "35"
            ],
            [
              "D",
              "40"
            ],
            [
              "E",
              "95"
            ]
          ],
          "answer": "A",
          "explain": "$55 + 40 - x = 80 \\Rightarrow x = 15$. Choice (E) is the sum without subtracting the overlap."
        },
        {
          "id": "rvs11",
          "type": "mc",
          "skills": [
            "rate-time"
          ],
          "prompt": "The average time it took Noah to swim each lap was 3 minutes 45 seconds. How long did it take him to swim 6 laps?",
          "choices": [
            [
              "A",
              "20 minutes 30 seconds"
            ],
            [
              "B",
              "21 minutes 45 seconds"
            ],
            [
              "C",
              "22 minutes 30 seconds"
            ],
            [
              "D",
              "22 minutes 50 seconds"
            ],
            [
              "E",
              "23 minutes 30 seconds"
            ]
          ],
          "answer": "C",
          "explain": "$6 \\times 3$ min $= 18$ min; $6 \\times 45$ s $= 270$ s $= 4$ min 30 s. Total $22$ min 30 s. Keep minutes and seconds separate, then convert the seconds."
        },
        {
          "id": "rvs12",
          "type": "mc",
          "skills": [
            "segment-algebra",
            "answer-asked"
          ],
          "prompt": "Points $A$, $B$, and $C$ lie on a line in that order. Segment $AB$ is 15 inches long, $AC = 4x + 3$, and $BC = 3x - 2$. How long is segment $AC$?",
          "choices": [
            [
              "A",
              "10 in"
            ],
            [
              "B",
              "28 in"
            ],
            [
              "C",
              "43 in"
            ],
            [
              "D",
              "58 in"
            ],
            [
              "E",
              "15 in"
            ]
          ],
          "answer": "C",
          "explain": "$AB = AC - BC$: $(4x + 3) - (3x - 2) = x + 5 = 15 \\Rightarrow x = 10$. Then $AC = 4(10) + 3 = 43$. Choice (A) is $x$; choice (B) is $BC$."
        },
        {
          "id": "rvs13",
          "type": "mc",
          "skills": [
            "reverse-percent"
          ],
          "prompt": "A phone is valued at \\$612 today. If it loses 15% of its value each year, what was its value one year ago?",
          "choices": [
            [
              "A",
              "\\$520"
            ],
            [
              "B",
              "\\$704"
            ],
            [
              "C",
              "\\$720"
            ],
            [
              "D",
              "\\$765"
            ],
            [
              "E",
              "\\$612"
            ]
          ],
          "answer": "C",
          "explain": "Losing 15% leaves 85%: $0.85x = 612 \\Rightarrow x = 720$. Choice (B) adds 15% to today's value, which applies the percent to the wrong amount."
        }
      ]
    },
    {
      "id": "sep1_d2_review_qr",
      "day": "Day 2 · Wed Sept 2",
      "availableFrom": "2026-09-02",
      "order": 71,
      "title": "Review B — ISEE Quantitative Reasoning",
      "subtitle": "12 word problems + 9 quantitative comparisons · ISEE rules · 25 minutes",
      "scoring": "isee",
      "timeLimitS": 1500,
      "intro": [
        {
          "type": "directions",
          "html": "<b>Directions — Questions 1–12:</b> Each question has four suggested answers. Select the best answer. Answer every question — there is no penalty for a wrong answer.<br><b>Directions — Questions 13–21 (Quantitative Comparisons):</b> Using all information given, compare the quantity in Column A to the quantity in Column B and select (A) if Column A is greater, (B) if Column B is greater, (C) if they are equal, or (D) if the relationship cannot be determined from the information given."
        },
        {
          "type": "reference",
          "title": "Strategy Reference — Prove It Before You Choose",
          "html": "Choosing (A), (B), or (C) claims the relationship holds in <i>every</i> allowed case. Try to break it: test a second value, test a weird value (a fraction between 0 and 1, a negative, zero), or compute the actual number. If the comparison ever changes, the answer is (D). \"Not drawn to scale\" means the picture proves nothing."
        }
      ],
      "items": [
        {
          "id": "rvq1",
          "type": "mc",
          "skills": [
            "spatial-view"
          ],
          "prompt": "A solid is built from identical cubes. The bottom layer is three cubes arranged in an L shape, and one more cube sits on top of the corner cube of the L. Which figure represents the view of the solid from directly above?",
          "choices": [
            [
              "A",
              "An L shape made of 3 squares"
            ],
            [
              "B",
              "A 2-by-2 square made of 4 squares"
            ],
            [
              "C",
              "A row of 4 squares"
            ],
            [
              "D",
              "A single square"
            ]
          ],
          "answer": "A",
          "explain": "From above, stacked cubes cover the same square; the top view shows one square for each column of cubes. The footprint is the L of 3 squares. Choice (B) counts the stacked cube as extra floor space."
        },
        {
          "id": "rvq2",
          "type": "mc",
          "skills": [
            "stats-mean"
          ],
          "prompt": "Twelve ropes have a mean length of 30 inches. If 5 inches are cut from every rope, what is the new mean length?",
          "choices": [
            [
              "A",
              "25 inches"
            ],
            [
              "B",
              "30 inches"
            ],
            [
              "C",
              "35 inches"
            ],
            [
              "D",
              "It cannot be determined from the information given."
            ]
          ],
          "answer": "A",
          "explain": "Subtracting the same amount from every value subtracts that amount from the mean: $30 - 5 = 25$."
        },
        {
          "id": "rvq3",
          "type": "mc",
          "skills": [
            "triangle-area"
          ],
          "prompt": "Rectangle $ABCD$ has $AB = 10$ cm and $BC = 4$ cm. Point $M$ is the midpoint of side $DC$. What is the area of triangle $BCM$?",
          "choices": [
            [
              "A",
              "8 cm²"
            ],
            [
              "B",
              "10 cm²"
            ],
            [
              "C",
              "20 cm²"
            ],
            [
              "D",
              "40 cm²"
            ]
          ],
          "answer": "B",
          "explain": "$DC = AB = 10$, so $CM = 5$. The triangle's legs are $CM = 5$ and $BC = 4$: area $= \\tfrac{1}{2}(5)(4) = 10$. Choice (C) forgets the ½; choice (D) is the rectangle."
        },
        {
          "id": "rvq4",
          "type": "mc",
          "skills": [
            "stats-mean-median-effect"
          ],
          "prompt": "A class of 25 students has a mean score of 82% and a median of 85%. Only two students scored below 60%. Both retake the exam and score 65% and 70%. Which statement is true?",
          "choices": [
            [
              "A",
              "The mean and median both increase."
            ],
            [
              "B",
              "The mean increases and the median is unchanged."
            ],
            [
              "C",
              "The median increases and the mean is unchanged."
            ],
            [
              "D",
              "The mean and median both stay the same."
            ]
          ],
          "answer": "B",
          "explain": "Two scores rose, so the total and the mean rise. Both new scores are still below the median, so the middle value does not move."
        },
        {
          "id": "rvq5",
          "type": "mc",
          "skills": [
            "sum-series"
          ],
          "prompt": "If the sum of all integers from 1 to 300, inclusive, is $x$, which expression represents the sum of all integers from 1 to 298, inclusive?",
          "choices": [
            [
              "A",
              "$x - 2$"
            ],
            [
              "B",
              "$x - 299$"
            ],
            [
              "C",
              "$x - 599$"
            ],
            [
              "D",
              "$x + 599$"
            ]
          ],
          "answer": "C",
          "explain": "The second sum is missing 299 and 300: $x - (299 + 300) = x - 599$. Choice (A) subtracts the count of missing terms, not their values."
        },
        {
          "id": "rvq6",
          "type": "mc",
          "skills": [
            "perimeter-area"
          ],
          "prompt": "A rectangle has an area of 48 square centimeters, and its length and width are whole numbers of centimeters. What is the least possible perimeter?",
          "choices": [
            [
              "A",
              "14 cm"
            ],
            [
              "B",
              "28 cm"
            ],
            [
              "C",
              "32 cm"
            ],
            [
              "D",
              "98 cm"
            ]
          ],
          "answer": "B",
          "explain": "Factor pairs of 48: 1×48, 2×24, 3×16, 4×12, 6×8. The pair closest to a square gives the least perimeter: $2(6 + 8) = 28$."
        },
        {
          "id": "rvq7",
          "type": "mc",
          "skills": [
            "answer-asked"
          ],
          "prompt": "If $\\tfrac{1}{4}a + \\tfrac{1}{4}b = -5$, what is the value of $2a + 2b$?",
          "choices": [
            [
              "A",
              "−40"
            ],
            [
              "B",
              "−20"
            ],
            [
              "C",
              "−10"
            ],
            [
              "D",
              "−5"
            ]
          ],
          "answer": "A",
          "explain": "Multiply by 4: $a + b = -20$. Then $2(a + b) = -40$. Choice (B) stops at $a + b$."
        },
        {
          "id": "rvq8",
          "type": "mc",
          "skills": [
            "chart-read"
          ],
          "prompt": "A set of 21 heights, in inches, is symmetric about 65 inches. The range is 8 inches and the minimum is 61 inches. There are 2 values of 61, 3 values of 62, and 4 values of 64. How many values are 66, 68, or 69 inches?",
          "choices": [
            [
              "A",
              "6"
            ],
            [
              "B",
              "9"
            ],
            [
              "C",
              "12"
            ],
            [
              "D",
              "21"
            ]
          ],
          "answer": "B",
          "explain": "Symmetry about 65 pairs 61↔69, 62↔68, 64↔66. So there are 2 values of 69, 3 of 68, and 4 of 66: $2 + 3 + 4 = 9$."
        },
        {
          "id": "rvq9",
          "type": "mc",
          "skills": [
            "lcm-product"
          ],
          "prompt": "If $x$ is a multiple of 6 and $y$ is a multiple of 9, what is the least possible value of the product $xy$?",
          "choices": [
            [
              "A",
              "18"
            ],
            [
              "B",
              "27"
            ],
            [
              "C",
              "54"
            ],
            [
              "D",
              "108"
            ]
          ],
          "answer": "C",
          "explain": "The least values are $x = 6$ and $y = 9$, so the least product is $6 \\times 9 = 54$. Choice (A) is the least common multiple, which answers a different question."
        },
        {
          "id": "rvq10",
          "type": "mc",
          "skills": [
            "percent-chain"
          ],
          "prompt": "The length of a rectangle is increased by 30 percent and its width is decreased by 20 percent. What is the percent change in the area?",
          "choices": [
            [
              "A",
              "an increase of 4%"
            ],
            [
              "B",
              "an increase of 5%"
            ],
            [
              "C",
              "an increase of 10%"
            ],
            [
              "D",
              "an increase of 24%"
            ]
          ],
          "answer": "A",
          "explain": "Percent changes multiply: $1.30 \\times 0.80 = 1.04$, an increase of 4%. Choice (C) adds the percents."
        },
        {
          "id": "rvq11",
          "type": "mc",
          "skills": [
            "scale-area"
          ],
          "prompt": "The ratio of the radius of Sphere P to the radius of Sphere Q is 1 to 4. The surface area of Sphere Q is how many times the surface area of Sphere P? (Surface area of a sphere $= 4\\pi r^2$)",
          "choices": [
            [
              "A",
              "4"
            ],
            [
              "B",
              "8"
            ],
            [
              "C",
              "16"
            ],
            [
              "D",
              "64"
            ]
          ],
          "answer": "C",
          "explain": "Surface area scales with the square of the radius: $4^2 = 16$. Choice (D) is the volume factor $4^3$."
        },
        {
          "id": "rvq12",
          "type": "mc",
          "skills": [
            "factors"
          ],
          "prompt": "What is the sum of the two smallest factors shared by 24 and 40?",
          "choices": [
            [
              "A",
              "3"
            ],
            [
              "B",
              "6"
            ],
            [
              "C",
              "10"
            ],
            [
              "D",
              "12"
            ]
          ],
          "answer": "A",
          "explain": "Factors of 24: 1, 2, 3, 4, …; factors of 40: 1, 2, 4, 5, …. The two smallest common factors are 1 and 2; their sum is 3. Choice (B) forgets that 1 is a factor of every number."
        },
        {
          "id": "rvq13",
          "type": "qc",
          "skills": [
            "qc-algebra"
          ],
          "prompt": "",
          "colA": "$3(x^2 - 2)$",
          "colB": "$3x^2 - 2$",
          "choices": [
            [
              "A",
              "The quantity in Column A is greater."
            ],
            [
              "B",
              "The quantity in Column B is greater."
            ],
            [
              "C",
              "The two quantities are equal."
            ],
            [
              "D",
              "The relationship cannot be determined from the information given."
            ]
          ],
          "answer": "B",
          "explain": "Distribute: Column A $= 3x^2 - 6$. Column B $= 3x^2 - 2$. Whatever $x$ is, Column A is exactly 4 less, so Column B is greater."
        },
        {
          "id": "rvq14",
          "type": "qc",
          "skills": [
            "qc-boundary"
          ],
          "prompt": "A hat contains pieces of paper numbered 3 through 9.",
          "colA": "The probability of choosing an even number",
          "colB": "The probability of choosing a number greater than 6",
          "choices": [
            [
              "A",
              "The quantity in Column A is greater."
            ],
            [
              "B",
              "The quantity in Column B is greater."
            ],
            [
              "C",
              "The two quantities are equal."
            ],
            [
              "D",
              "The relationship cannot be determined from the information given."
            ]
          ],
          "answer": "C",
          "explain": "Papers: 3, 4, 5, 6, 7, 8, 9 (seven). Even: 4, 6, 8 → $\\tfrac{3}{7}$. Greater than 6: 7, 8, 9 → $\\tfrac{3}{7}$. Equal. \"Greater than 6\" does not include 6."
        },
        {
          "id": "rvq15",
          "type": "qc",
          "skills": [
            "qc-label"
          ],
          "prompt": "A drawer holds pencils and pens. There are 4 times as many pencils as pens, and 50 items in all.",
          "colA": "The number of pens",
          "colB": "12",
          "choices": [
            [
              "A",
              "The quantity in Column A is greater."
            ],
            [
              "B",
              "The quantity in Column B is greater."
            ],
            [
              "C",
              "The two quantities are equal."
            ],
            [
              "D",
              "The relationship cannot be determined from the information given."
            ]
          ],
          "answer": "B",
          "explain": "Let pens $= x$; pencils $= 4x$; $5x = 50 \\Rightarrow x = 10$. Column A is 10, which is less than 12. Compare the group the column names (pens), not the one you solved for first (pencils, 40)."
        },
        {
          "id": "rvq16",
          "type": "qc",
          "skills": [
            "qc-not-to-scale"
          ],
          "prompt": "Rectangle P has sides $m$ and $4m$ and an area of 100 ft². Rectangle Q has sides $n$ and $3n$. Figures not drawn to scale.",
          "colA": "$m$",
          "colB": "$n$",
          "choices": [
            [
              "A",
              "The quantity in Column A is greater."
            ],
            [
              "B",
              "The quantity in Column B is greater."
            ],
            [
              "C",
              "The two quantities are equal."
            ],
            [
              "D",
              "The relationship cannot be determined from the information given."
            ]
          ],
          "answer": "D",
          "explain": "$4m^2 = 100 \\Rightarrow m = 5$. Nothing is given about Rectangle Q's area, so $n$ could be anything. A comparison with an unconstrained quantity is (D)."
        },
        {
          "id": "rvq17",
          "type": "qc",
          "skills": [
            "polygon-angles"
          ],
          "prompt": "The sum of the interior angles of a polygon with $n$ sides is $180(n - 2)$.",
          "colA": "The measure of one interior angle of a regular octagon",
          "colB": "The measure of one interior angle of a regular pentagon",
          "choices": [
            [
              "A",
              "The quantity in Column A is greater."
            ],
            [
              "B",
              "The quantity in Column B is greater."
            ],
            [
              "C",
              "The two quantities are equal."
            ],
            [
              "D",
              "The relationship cannot be determined from the information given."
            ]
          ],
          "answer": "A",
          "explain": "Octagon: $180(6)/8 = 135°$. Pentagon: $180(3)/5 = 108°$. More sides means each interior angle is larger — compute, don't assume."
        },
        {
          "id": "rvq18",
          "type": "qc",
          "skills": [
            "counting-pairs"
          ],
          "prompt": "Six teams each play every other team exactly once.",
          "colA": "The total number of games played",
          "colB": "30",
          "choices": [
            [
              "A",
              "The quantity in Column A is greater."
            ],
            [
              "B",
              "The quantity in Column B is greater."
            ],
            [
              "C",
              "The two quantities are equal."
            ],
            [
              "D",
              "The relationship cannot be determined from the information given."
            ]
          ],
          "answer": "B",
          "explain": "Each pair of teams plays once: $5 + 4 + 3 + 2 + 1 = 15$ games. $6 \\times 5 = 30$ counts every game twice."
        },
        {
          "id": "rvq19",
          "type": "qc",
          "skills": [
            "negatives-magnitude"
          ],
          "prompt": "$n$ is a positive even integer.",
          "colA": "$(-4)^n$",
          "colB": "$-4^{\\,n+1}$",
          "choices": [
            [
              "A",
              "The quantity in Column A is greater."
            ],
            [
              "B",
              "The quantity in Column B is greater."
            ],
            [
              "C",
              "The two quantities are equal."
            ],
            [
              "D",
              "The relationship cannot be determined from the information given."
            ]
          ],
          "answer": "A",
          "explain": "With $n$ even, $(-4)^n$ is positive. $-4^{n+1}$ has no parentheses, so the negative is applied after the power: it is negative. Positive beats negative regardless of size."
        },
        {
          "id": "rvq20",
          "type": "qc",
          "skills": [
            "qc-assumed-similarity"
          ],
          "prompt": "Triangle 1 has sides of length 5, 12, and $y$. Triangle 2 has sides of length 10, 24, and $z$. The triangles are not drawn to scale.",
          "colA": "$y$",
          "colB": "$z$",
          "choices": [
            [
              "A",
              "The quantity in Column A is greater."
            ],
            [
              "B",
              "The quantity in Column B is greater."
            ],
            [
              "C",
              "The two quantities are equal."
            ],
            [
              "D",
              "The relationship cannot be determined from the information given."
            ]
          ],
          "answer": "D",
          "explain": "Nothing says the triangles are right triangles or similar. $y$ can be anything between 7 and 17; $z$ anything between 14 and 34. Assuming 5-12-13 and 10-24-26 supplies information that was never given."
        },
        {
          "id": "rvq21",
          "type": "qc",
          "skills": [
            "qc-one-case"
          ],
          "prompt": "The area of a rectangle is 36 cm².",
          "colA": "The perimeter of the rectangle",
          "colB": "24 cm",
          "choices": [
            [
              "A",
              "The quantity in Column A is greater."
            ],
            [
              "B",
              "The quantity in Column B is greater."
            ],
            [
              "C",
              "The two quantities are equal."
            ],
            [
              "D",
              "The relationship cannot be determined from the information given."
            ]
          ],
          "answer": "D",
          "explain": "A 6×6 rectangle has perimeter 24 (equal); a 4×9 rectangle has perimeter 26 (greater); 2×18 gives 40. The comparison changes, so it cannot be determined. One matching case is not proof."
        }
      ]
    },
    {
      "id": "sep1_d2_review_ma",
      "day": "Day 2 · Wed Sept 2",
      "availableFrom": "2026-09-02",
      "order": 72,
      "title": "Review C — ISEE Mathematics Achievement",
      "subtitle": "18 questions · ISEE rules · 25 minutes",
      "scoring": "isee",
      "timeLimitS": 1500,
      "intro": [
        {
          "type": "directions",
          "html": "<b>Directions:</b> Each question is followed by four suggested answers. Select the best answer. Answer every question — there is no penalty for a wrong answer."
        }
      ],
      "items": [
        {
          "id": "rvm1",
          "type": "mc",
          "skills": [
            "grid-area"
          ],
          "prompt": "On a grid where each square has an area of 9 cm², a right triangle is drawn with one leg 4 squares long and the other leg 3 squares long. What is the area of the triangle?",
          "choices": [
            [
              "A",
              "27 cm²"
            ],
            [
              "B",
              "54 cm²"
            ],
            [
              "C",
              "72 cm²"
            ],
            [
              "D",
              "108 cm²"
            ]
          ],
          "answer": "B",
          "explain": "Area in squares $= \\tfrac{1}{2}(4)(3) = 6$ squares; each square is 9 cm², so $6 \\times 9 = 54$ cm². Choice (D) forgets the ½."
        },
        {
          "id": "rvm2",
          "type": "mc",
          "skills": [
            "prob-mult"
          ],
          "prompt": "A box contains 7 blue, 5 green, and 8 red crayons. One crayon is selected at random and returned to the box, then a second crayon is selected. What is the probability that both crayons are green?",
          "choices": [
            [
              "A",
              "$\\tfrac{1}{5}$"
            ],
            [
              "B",
              "$\\tfrac{5}{20} \\times \\tfrac{5}{20}$"
            ],
            [
              "C",
              "$\\tfrac{5}{20} \\times \\tfrac{4}{19}$"
            ],
            [
              "D",
              "$\\tfrac{1}{5} \\times \\tfrac{1}{4}$"
            ]
          ],
          "answer": "B",
          "explain": "There are 20 crayons, so $P(\\text{green}) = \\tfrac{5}{20}$ each time because the crayon is returned. Multiply: $\\tfrac{5}{20} \\times \\tfrac{5}{20}$. Choice (C) is without replacement."
        },
        {
          "id": "rvm3",
          "type": "mc",
          "skills": [
            "radicals"
          ],
          "prompt": "Which numerical expression does NOT represent an integer?",
          "choices": [
            [
              "A",
              "$\\sqrt{81} - \\sqrt{16}$"
            ],
            [
              "B",
              "$\\sqrt{36} + \\sqrt{4}$"
            ],
            [
              "C",
              "$\\sqrt{100 - 19}$"
            ],
            [
              "D",
              "$\\sqrt{25 + 5}$"
            ]
          ],
          "answer": "D",
          "explain": "(A) $9 - 4 = 5$; (B) $6 + 2 = 8$; (C) $\\sqrt{81} = 9$; (D) $\\sqrt{30}$ is not an integer. Check what is under each radical before simplifying."
        },
        {
          "id": "rvm4",
          "type": "mc",
          "skills": [
            "reverse-percent"
          ],
          "prompt": "A poll predicted that 40% of an estimated 5,000 voters would support a candidate. If 60 people in the poll chose that candidate, how many people were polled?",
          "choices": [
            [
              "A",
              "96"
            ],
            [
              "B",
              "150"
            ],
            [
              "C",
              "240"
            ],
            [
              "D",
              "2,000"
            ]
          ],
          "answer": "B",
          "explain": "60 is 40% of the number polled: $0.40x = 60 \\Rightarrow x = 150$. The 5,000 is a distractor; the poll size is what is asked."
        },
        {
          "id": "rvm5",
          "type": "mc",
          "skills": [
            "fraction-zero"
          ],
          "prompt": "For what value(s) of $c$ is $\\dfrac{c - 3}{c + 5} = 0$?",
          "choices": [
            [
              "A",
              "$-5$"
            ],
            [
              "B",
              "$3$"
            ],
            [
              "C",
              "$-5$ and $3$"
            ],
            [
              "D",
              "There are no values of $c$ that make the equation true."
            ]
          ],
          "answer": "B",
          "explain": "A fraction is 0 only when the numerator is 0 and the denominator is not: $c - 3 = 0 \\Rightarrow c = 3$. At $c = -5$ the fraction is undefined, not zero."
        },
        {
          "id": "rvm6",
          "type": "mc",
          "skills": [
            "unit-conversion"
          ],
          "prompt": "There are 2.54 centimeters in an inch. A conveyor belt moves 120 inches per minute. Which expression gives its speed in centimeters per second?",
          "choices": [
            [
              "A",
              "$\\dfrac{120 \\times 2.54}{60}$"
            ],
            [
              "B",
              "$\\dfrac{120 \\times 60}{2.54}$"
            ],
            [
              "C",
              "$\\dfrac{60}{120 \\times 2.54}$"
            ],
            [
              "D",
              "$\\dfrac{120}{2.54 \\times 60}$"
            ]
          ],
          "answer": "A",
          "explain": "Write the units and cancel: $\\dfrac{120\\ \\text{in}}{1\\ \\text{min}} \\times \\dfrac{2.54\\ \\text{cm}}{1\\ \\text{in}} \\times \\dfrac{1\\ \\text{min}}{60\\ \\text{s}}$. Inches and minutes cancel, leaving cm per second."
        },
        {
          "id": "rvm7",
          "type": "mc",
          "skills": [
            "stats-median-grouped"
          ],
          "prompt": "The table shows the number of goals scored by each of 25 players this season. What is the median number of goals?<table class=\"dtable\"><tr><th>Goals</th><td>0</td><td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td></tr><tr><th>Players</th><td>2</td><td>6</td><td>5</td><td>4</td><td>3</td><td>3</td><td>2</td></tr></table>",
          "choices": [
            [
              "A",
              "2"
            ],
            [
              "B",
              "3"
            ],
            [
              "C",
              "3.5"
            ],
            [
              "D",
              "4"
            ]
          ],
          "answer": "A",
          "explain": "$n = 25$, median is the 13th value. Cumulative: 0 → 1–2; 1 → 3–8; 2 → 9–13. The 13th value is 2. Choice (B) is the middle of the axis."
        },
        {
          "id": "rvm8",
          "type": "mc",
          "skills": [
            "stats-weighted-mean"
          ],
          "prompt": "Ava's four quiz scores are 80, 92, 84, and 88. Her midterm will count twice in her mean. What midterm score raises her mean by 3 points?",
          "choices": [
            [
              "A",
              "89"
            ],
            [
              "B",
              "92"
            ],
            [
              "C",
              "95"
            ],
            [
              "D",
              "98"
            ]
          ],
          "answer": "C",
          "explain": "Current mean $= 344 \\div 4 = 86$; target 89. $\\dfrac{344 + 2x}{6} = 89 \\Rightarrow 344 + 2x = 534 \\Rightarrow x = 95$."
        },
        {
          "id": "rvm9",
          "type": "mc",
          "skills": [
            "stats-median-grouped"
          ],
          "prompt": "The frequency table shows the number of tables each of 15 servers handled in one hour. What is the median number of tables?<table class=\"dtable\"><tr><th>Tables</th><td>3</td><td>4</td><td>5</td><td>6</td><td>8</td></tr><tr><th>Servers</th><td>5</td><td>2</td><td>3</td><td>3</td><td>2</td></tr></table>",
          "choices": [
            [
              "A",
              "4"
            ],
            [
              "B",
              "4.5"
            ],
            [
              "C",
              "5"
            ],
            [
              "D",
              "5.2"
            ]
          ],
          "answer": "C",
          "explain": "$n = 15$, median is the 8th value. Cumulative: 3 → 1–5; 4 → 6–7; 5 → 8–10. The 8th value is 5. Choice (D) averages the labels."
        },
        {
          "id": "rvm10",
          "type": "mc",
          "skills": [
            "inequality-translate"
          ],
          "prompt": "A solution set on a number line has an open circle at $-2$, a closed circle at $5$, and the segment between them shaded. Which inequality matches this solution set?",
          "choices": [
            [
              "A",
              "$-5 < x - 3 \\le 2$"
            ],
            [
              "B",
              "$-5 \\le x - 3 < 2$"
            ],
            [
              "C",
              "$-6 < x + 1 \\le 1$"
            ],
            [
              "D",
              "$0 \\le x - 2 < 7$"
            ]
          ],
          "answer": "A",
          "explain": "The graph is $-2 < x \\le 5$ (open at $-2$, closed at 5). Add 3 to each part of (A): $-2 < x \\le 5$ ✓. (B) has the endpoints reversed; (C) gives $-7 < x \\le 0$; (D) gives $2 \\le x < 9$."
        },
        {
          "id": "rvm11",
          "type": "mc",
          "skills": [
            "imaginary"
          ],
          "prompt": "What is the solution set of $x^2 + 49 = 0$?",
          "choices": [
            [
              "A",
              "$7$"
            ],
            [
              "B",
              "$7i$"
            ],
            [
              "C",
              "$\\pm 7$"
            ],
            [
              "D",
              "$\\pm 7i$"
            ]
          ],
          "answer": "D",
          "explain": "$x^2 = -49$, so $x = \\pm\\sqrt{-49} = \\pm 7i$. The $+49$ forces a negative square, which real numbers cannot give, and the square root introduces both signs."
        },
        {
          "id": "rvm12",
          "type": "mc",
          "skills": [
            "distance-formula"
          ],
          "prompt": "The point $(1, 2)$ lies on a circle with center $(4, 6)$. What is the radius of the circle?",
          "choices": [
            [
              "A",
              "5"
            ],
            [
              "B",
              "7"
            ],
            [
              "C",
              "$\\sqrt{7}$"
            ],
            [
              "D",
              "25"
            ]
          ],
          "answer": "A",
          "explain": "Radius $=$ distance between the points: $\\sqrt{(4-1)^2 + (6-2)^2} = \\sqrt{9 + 16} = 5$. Choice (B) adds the legs instead of using the Pythagorean theorem."
        },
        {
          "id": "rvm13",
          "type": "mc",
          "skills": [
            "gcf"
          ],
          "prompt": "If $a$ and $b$ are prime numbers, what is the greatest common factor of $6a$, $9ab^2$, and $12a^2b$?",
          "choices": [
            [
              "A",
              "$3a$"
            ],
            [
              "B",
              "$3ab$"
            ],
            [
              "C",
              "$12ab$"
            ],
            [
              "D",
              "$36a^2b^2$"
            ]
          ],
          "answer": "A",
          "explain": "GCF of 6, 9, 12 is 3. Every term has at least one $a$; the first term has no $b$, so $b$ is not common. GCF $= 3a$."
        },
        {
          "id": "rvm14",
          "type": "mc",
          "skills": [
            "sequence-explicit"
          ],
          "prompt": "The first five terms of an arithmetic sequence are $-5, -1, 3, 7, 11$. Which expression represents the $n$th term?",
          "choices": [
            [
              "A",
              "$n - 5$"
            ],
            [
              "B",
              "$n + 4$"
            ],
            [
              "C",
              "$4n - 9$"
            ],
            [
              "D",
              "$4n - 5$"
            ]
          ],
          "answer": "C",
          "explain": "The common difference is 4, so the rule has the form $4n + c$. Test $n = 1$: $4(1) + c = -5 \\Rightarrow c = -9$. Choice (B) describes the step, not the $n$th term."
        },
        {
          "id": "rvm15",
          "type": "mc",
          "skills": [
            "coordinate-geometry"
          ],
          "prompt": "Three vertices of a trapezoid are $(0, 0)$, $(6, 0)$, and $(4, 3)$. Which ordered pair could be the fourth vertex?",
          "choices": [
            [
              "A",
              "$(1, 3)$"
            ],
            [
              "B",
              "$(2, 4)$"
            ],
            [
              "C",
              "$(7, 2)$"
            ],
            [
              "D",
              "$(3, 5)$"
            ]
          ],
          "answer": "A",
          "explain": "A trapezoid needs one pair of parallel sides. The side from $(0,0)$ to $(6,0)$ is horizontal, so a fourth vertex with $y = 3$ makes the opposite side horizontal too: $(1, 3)$. Check the other choices — none produces a parallel pair."
        },
        {
          "id": "rvm16",
          "type": "mc",
          "skills": [
            "function-notation"
          ],
          "prompt": "If $f(x - 4) = 3x + 5$ for all values of $x$, what is the value of $f(2)$?",
          "choices": [
            [
              "A",
              "23"
            ],
            [
              "B",
              "11"
            ],
            [
              "C",
              "17"
            ],
            [
              "D",
              "−1"
            ]
          ],
          "answer": "A",
          "explain": "Solve the argument first: $x - 4 = 2 \\Rightarrow x = 6$. Then $f(2) = 3(6) + 5 = 23$. Choice (B) substitutes 2 for $x$."
        },
        {
          "id": "rvm17",
          "type": "mc",
          "skills": [
            "rational-equation"
          ],
          "prompt": "What is the value of $k$ in the equation $\\dfrac{1}{4k^2} = \\dfrac{1}{2k^2} - \\dfrac{1}{k}$?",
          "choices": [
            [
              "A",
              "$\\tfrac{1}{4}$"
            ],
            [
              "B",
              "$\\tfrac{1}{2}$"
            ],
            [
              "C",
              "2"
            ],
            [
              "D",
              "4"
            ]
          ],
          "answer": "A",
          "explain": "Multiply every term by $4k^2$: $1 = 2 - 4k$, so $4k = 1$ and $k = \\tfrac{1}{4}$. Multiply <i>every</i> term, including the one on the left."
        },
        {
          "id": "rvm18",
          "type": "mc",
          "skills": [
            "trig-ratio"
          ],
          "prompt": "In right triangle $PQR$, the right angle is at $R$, angle $P$ measures $40°$, and side $QR$ (the side opposite angle $P$) is 20 feet. Which expression equals the length of the hypotenuse $PQ$?",
          "choices": [
            [
              "A",
              "$20 \\sin 40°$"
            ],
            [
              "B",
              "$20 \\cos 40°$"
            ],
            [
              "C",
              "$\\dfrac{20}{\\sin 40°}$"
            ],
            [
              "D",
              "$\\dfrac{20}{\\cos 40°}$"
            ]
          ],
          "answer": "C",
          "explain": "From angle $P$, $QR$ is opposite and $PQ$ is the hypotenuse: $\\sin 40° = \\dfrac{20}{PQ}$, so $PQ = \\dfrac{20}{\\sin 40°}$. Identify opposite vs. adjacent from the angle named, then pick the ratio."
        }
      ]
    },

    /* ==================== DAY 3 ==================== */
    {
      id: 'sep1_d3_warmup', day: 'Day 3 · Thu Sept 3', availableFrom: '2026-09-03', order: 80,
      title: 'Warm-Up', subtitle: '3 questions · typed answers', scoring: 'none', timeLimitS: null,
      items: [
        { id: 'd3w1', type: 'numeric', skills: ['scale-area'], prompt: 'Two similar triangles have perimeters in the ratio $2:5$. What is the ratio of their areas? (Enter as a ratio such as 3:7.)', answer: '4:25', accept: ['4/25', '4 to 25'],
          explain: 'Perimeters are lengths, so the length factor is $2:5$; areas scale by its square, $4:25$.' },
        { id: 'd3w2', type: 'numeric', skills: ['stats-median-grouped'], prompt: 'A data set consists of the value 2 three times, the value 4 twice, and the value 7 four times. What is the median of the data set?', answer: '4',
          explain: 'Nine values in order: 2, 2, 2, 4, 4, 7, 7, 7, 7. The 5th value is 4.' },
        { id: 'd3w3', type: 'numeric', skills: ['sign-reversal', 'answer-asked'], prompt: 'If $5m - 5n = 40$, what is the value of $n - m$?', answer: '-8',
          explain: '$m - n = 8$, so $n - m = -8$. The question asks for the reversed difference.' },
      ],
    },
    {
      id: 'sep1_d3_reading', day: 'Day 3 · Thu Sept 3', availableFrom: '2026-09-03', order: 90,
      title: 'Reading Comprehension Mini-Section', subtitle: 'SSAT rules · 2 passages · 12 questions · 10 minutes · timed', scoring: 'ssat', timeLimitS: 600,
      intro: [{ type: 'directions', html: '<b>Directions:</b> The timer starts when you press Begin — five minutes per passage. Read each passage carefully and then answer the questions about it. Before the questions for a passage appear, complete the line <i>"The author\'s point is …"</i> beneath it. For every question about a detail, find the line of the passage that proves the answer before choosing.' }],
      passages: [
        { id: 'p_fireflies', html: '<p>For most of the twentieth century, reports that thousands of fireflies could flash in perfect unison were dismissed by many scientists as an illusion. Observers in Southeast Asia had described whole riverbanks of trees pulsing with light, but the claim seemed to require a level of coordination that insects were not thought to possess. It was not until the early 1990s that researchers documented the phenomenon in the United States, in the Great Smoky Mountains, where one species, <i>Photinus carolinus</i>, gathers by the thousands each June.</p><p><i>Photinus carolinus</i> is one of roughly two thousand firefly species worldwide, and it belongs to the genus <i>Photinus</i>, a group whose members are found throughout North America. What sets <i>P. carolinus</i> apart is not its light but its timing. Males produce a burst of five to eight flashes, then go dark for about eight seconds. During that pause, neighboring males adjust their own rhythm, and within minutes an entire hillside is flashing and pausing together.</p><p>The mechanism appears to be simple. Each male responds to the flashes he sees nearby by resetting his internal timer, in much the way that a person clapping in a crowd unconsciously falls into step with those around them. No leader is required; the pattern emerges from thousands of individual adjustments. Researchers believe the synchrony helps females, which flash from the ground, to distinguish the signal of their own species from the flashes of other fireflies active at the same time.</p><p>Since the 1990s the display has drawn so many visitors that the national park now admits viewers by lottery. Scientists remain cautious, however, about attributing the synchrony to any single cause; several competing explanations are still being tested.</p>' },
        { id: 'p_savage', html: '<p>Augusta Savage was born in 1892 in Green Cove Springs, Florida, where as a child she shaped small figures from the red clay near her home. Her father, a minister, disapproved of the practice and at times destroyed her work, but she continued. In 1921 she moved to New York City and enrolled at Cooper Union, completing its four-year sculpture program in three years.</p><p>Two years later, Savage applied to a summer art program in France and was accepted, then rejected when the committee learned that she was Black. Rather than accept the decision quietly, she wrote to newspapers and made the case public. The program\'s decision did not change, but the episode established her as someone willing to confront discrimination in the art world directly. By the end of the decade she had won a fellowship that allowed her to study in Paris, where she produced some of her best-known work, including a bust of a Harlem boy titled <i>Gamin</i>.</p><p>When she returned to New York, Savage turned much of her energy toward teaching. In 1932 she opened a studio in Harlem that offered free instruction, and several of her students, among them the painter Jacob Lawrence, went on to significant careers. Her largest commission came in 1939, when she was asked to create a sculpture for the New York World\'s Fair. The result, a sixteen-foot work inspired by the song "Lift Every Voice and Sing," depicted a group of singers arranged as the strings of a harp. Savage could not afford to have it cast in bronze, and the plaster original was destroyed when the fair closed.</p><p>Historians often note that Savage\'s own output was relatively small. Her influence, they argue, is better measured in the artists she trained than in the works she left behind.</p>' },
      ],
      items: [
        { id: 'd3r1', type: 'reading', passage: 'p_fireflies', skills: ['rd-main-idea'], prompt: 'Which of the following best expresses the main idea of the passage?',
          choices: [['A', 'Fireflies in Southeast Asia flash in unison along riverbanks.'], ['B', 'The synchronized flashing of one firefly species, once doubted, has been documented and partly explained.'], ['C', 'The Great Smoky Mountains park admits visitors to the firefly display by lottery.'], ['D', 'Scientists have identified the single cause of synchronized flashing in fireflies.']], answer: 'B',
          explain: '(A) and (C) are true details that cover one paragraph each; (D) contradicts the final paragraph, which says scientists are cautious about any single cause.' },
        { id: 'd3r2', type: 'reading', passage: 'p_fireflies', skills: ['rd-detail'], prompt: 'According to the passage, after a burst of flashes a male <i>P. carolinus</i> goes dark for approximately',
          choices: [['A', 'five seconds'], ['B', 'eight seconds'], ['C', 'eight minutes'], ['D', 'five to eight minutes']], answer: 'B',
          explain: 'Paragraph 2: "then go dark for about eight seconds."' },
        { id: 'd3r3', type: 'reading', passage: 'p_fireflies', skills: ['rd-relationship'], prompt: 'Which of the following statements is supported by the passage?',
          choices: [['A', '<i>Photinus</i> is one species within the genus <i>Photinus carolinus</i>.'], ['B', '<i>Photinus carolinus</i> is one species within the genus <i>Photinus</i>.'], ['C', 'All fireflies in the genus <i>Photinus</i> flash in synchrony.'], ['D', '<i>Photinus carolinus</i> is found throughout Southeast Asia.']], answer: 'B',
          explain: 'Paragraph 2 states the species belongs to the genus <i>Photinus</i>. (A) reverses the relationship; (C) generalizes to the whole genus; (D) places the species on the wrong continent.' },
        { id: 'd3r4', type: 'reading', passage: 'p_fireflies', skills: ['rd-tone'], prompt: 'The author\'s tone in discussing the research on firefly synchrony can best be described as',
          choices: [['A', 'skeptical'], ['B', 'enthusiastic'], ['C', 'matter-of-fact'], ['D', 'alarmed']], answer: 'C',
          explain: 'The passage reports findings without judgment or excitement; the closing note of caution is descriptive, not skeptical. Matter-of-fact is the default for science writing.' },
        { id: 'd3r5', type: 'reading', passage: 'p_fireflies', skills: ['rd-inference'], prompt: 'The comparison to a person clapping in a crowd (paragraph 3) is used to show that',
          choices: [['A', 'fireflies imitate human behavior'], ['B', 'the synchrony arises without any leader directing it'], ['C', 'visitors to the park applaud the display'], ['D', 'the fireflies\' timing is set by a single dominant male']], answer: 'B',
          explain: 'The sentence after the comparison: "No leader is required; the pattern emerges from thousands of individual adjustments." (D) is the opposite of the passage\'s claim.' },
        { id: 'd3r6', type: 'reading', passage: 'p_fireflies', skills: ['rd-century'], prompt: 'The passage indicates that synchronized flashing was first documented in the United States in the',
          choices: [['A', 'eighteenth century'], ['B', 'nineteenth century'], ['C', 'first half of the twentieth century'], ['D', 'last decade of the twentieth century']], answer: 'D',
          explain: '"The early 1990s" belongs to the last decade of the twentieth century (1901–2000). The 1900s are the twentieth century, not the nineteenth.' },
        { id: 'd3r7', type: 'reading', passage: 'p_savage', skills: ['rd-main-idea'], prompt: 'Which of the following best expresses the main idea of the passage?',
          choices: [['A', 'Augusta Savage\'s largest sculpture was destroyed after the 1939 World\'s Fair.'], ['B', 'Augusta Savage overcame early obstacles to become a sculptor whose greatest legacy was her teaching.'], ['C', 'Augusta Savage\'s father destroyed the clay figures she made as a child.'], ['D', 'Augusta Savage produced more sculptures than any other artist in Harlem.']], answer: 'B',
          explain: 'The passage moves from obstacles to teaching and ends by stating her influence is measured in the artists she trained. (A) and (C) are single details; (D) contradicts "relatively small."' },
        { id: 'd3r8', type: 'reading', passage: 'p_savage', skills: ['rd-detail'], prompt: 'According to the passage, Savage completed Cooper Union\'s sculpture program in',
          choices: [['A', 'two years'], ['B', 'three years'], ['C', 'four years'], ['D', 'six years']], answer: 'B',
          explain: 'Paragraph 1: "completing its four-year sculpture program in three years." (C) is the program\'s length, not her time.' },
        { id: 'd3r9', type: 'reading', passage: 'p_savage', skills: ['rd-inference'], prompt: 'The passage suggests that Savage\'s public response to the French program\'s rejection',
          choices: [['A', 'persuaded the committee to reverse its decision'], ['B', 'ended her hopes of studying in Europe'], ['C', 'showed her willingness to challenge discrimination openly'], ['D', 'was criticized by other artists']], answer: 'C',
          explain: 'Paragraph 2: "the episode established her as someone willing to confront discrimination … directly." (A) contradicts "The program\'s decision did not change"; (B) contradicts the Paris fellowship.' },
        { id: 'd3r10', type: 'reading', passage: 'p_savage', skills: ['rd-vocab'], prompt: 'As used in the last paragraph, the word "output" most nearly means',
          choices: [['A', 'volume of sound'], ['B', 'body of finished work'], ['C', 'energy'], ['D', 'income']], answer: 'B',
          explain: '"Output" is contrasted with "the artists she trained," so it means the works she produced.' },
        { id: 'd3r11', type: 'reading', passage: 'p_savage', skills: ['rd-purpose'], prompt: 'The main purpose of the third paragraph is to',
          choices: [['A', 'describe Savage\'s years in Paris'], ['B', 'explain why the World\'s Fair sculpture was destroyed'], ['C', 'show how Savage\'s focus shifted toward teaching and large public work'], ['D', 'list the students who studied with Savage']], answer: 'C',
          explain: 'The paragraph opens with "turned much of her energy toward teaching" and then covers the World\'s Fair commission. (B) and (D) are single details within it; (A) is paragraph 2.' },
        { id: 'd3r12', type: 'reading', passage: 'p_savage', skills: ['rd-sequence'], prompt: 'The passage indicates that Savage opened her Harlem studio',
          choices: [['A', 'before she moved to New York'], ['B', 'before she studied in Paris'], ['C', 'after she returned from Paris'], ['D', 'after the World\'s Fair closed']], answer: 'C',
          explain: 'Paragraph 3 opens "When she returned to New York" and then gives 1932 for the studio; Paris was "by the end of the decade" of the 1920s. Order: New York (1921) → Paris → studio (1932) → World\'s Fair (1939).' },
      ],
    },
    {
      id: 'sep1_d3_verbal', day: 'Day 3 · Thu Sept 3', availableFrom: '2026-09-03', order: 100,
      title: 'Verbal Set', subtitle: '10 sentence completions (ISEE rules) + 6 analogies (SSAT rules) · 12 minutes', scoring: 'mixed', timeLimitS: 720,
      intro: [{ type: 'directions', html: '<b>Directions — Sentence Completions:</b> Select the word or pair of words that best completes the sentence. Before looking at the choices, predict the meaning of the missing word from the sentence\'s signal words and decide whether it is positive or negative.<br><b>Directions — Analogies:</b> Write the bridge sentence first; the choices appear once it is written.' }],
      items: [
        { id: 'd3v1', type: 'completion', skills: ['vocab-completion', 'w:ruse'], prompt: 'Rather than confront the guard, the prisoners relied on a -------: one pretended to be ill while the others slipped past.', choices: [['A', 'ruse'], ['B', 'precedent'], ['C', 'tome'], ['D', 'parody']], answer: 'A', explain: '<b>ruse</b> — a trick; the colon introduces the trick itself.' },
        { id: 'd3v2', type: 'completion', skills: ['vocab-completion', 'w:judicious'], prompt: 'The committee praised the treasurer\'s ------- management of the budget; every expense had been weighed carefully against its benefit.', choices: [['A', 'vacuous'], ['B', 'judicious'], ['C', 'transient'], ['D', 'prolific']], answer: 'B', explain: '<b>judicious</b> — showing good judgment; the semicolon restates it ("weighed carefully").' },
        { id: 'd3v3', type: 'completion', skills: ['vocab-completion', 'w:enigma'], prompt: 'The cause of the ancient city\'s sudden abandonment remains an ------- that no excavation has resolved.', choices: [['A', 'ardor'], ['B', 'amelioration'], ['C', 'enigma'], ['D', 'delineation']], answer: 'C', explain: '<b>enigma</b> — a mystery; "no excavation has resolved" is the clue.' },
        { id: 'd3v4', type: 'completion', skills: ['vocab-completion', 'w:incorrigible'], prompt: 'Although the coach tried every approach, the ------- player kept ignoring instructions.', choices: [['A', 'demure'], ['B', 'solicitous'], ['C', 'incorrigible'], ['D', 'deft']], answer: 'C', explain: '<b>incorrigible</b> — not able to be corrected; "although … every approach" signals it.' },
        { id: 'd3v5', type: 'completion', skills: ['vocab-completion', 'w:solicitous'], prompt: 'The nurse was so ------- toward the frightened patient, checking on him every few minutes, that he soon relaxed.', choices: [['A', 'solicitous'], ['B', 'incorrigible'], ['C', 'vacuous'], ['D', 'transient']], answer: 'A', explain: '<b>solicitous</b> — attentive and concerned; "checking on him every few minutes" restates it. The word is unrelated to <i>soliciting</i>.' },
        { id: 'd3v6', type: 'completion', skills: ['vocab-completion', 'w:usurp'], prompt: 'The general\'s ------- of power from the elected council was condemned by neighboring nations.', choices: [['A', 'culmination'], ['B', 'usurpation'], ['C', 'amelioration'], ['D', 'penchant']], answer: 'B', explain: '<b>usurpation</b> — seizing power without right; "condemned" confirms the negative charge.' },
        { id: 'd3v7', type: 'completion', skills: ['vocab-completion', 'w:culminate'], prompt: 'Years of training ------- in a single performance that the critics called flawless.', choices: [['A', 'belittled'], ['B', 'squandered'], ['C', 'culminated'], ['D', 'rued']], answer: 'C', explain: '<b>culminated</b> — reached a high point; "years of training … in a single performance."' },
        { id: 'd3v8', type: 'completion', skills: ['vocab-completion', 'w:parody'], prompt: 'The comedian\'s ------- of the evening news copied the anchor\'s gestures so exactly that the audience roared.', choices: [['A', 'parody'], ['B', 'precedent'], ['C', 'crypt'], ['D', 'tome']], answer: 'A', explain: '<b>parody</b> — an imitation for comic effect; "copied the anchor\'s gestures … roared."' },
        { id: 'd3v9', type: 'completion', skills: ['vocab-completion', 'w:penchant'], prompt: 'Her ------- for collecting old maps eventually filled three rooms of the house.', choices: [['A', 'amelioration'], ['B', 'penchant'], ['C', 'rue'], ['D', 'delineation']], answer: 'B', explain: '<b>penchant</b> — a strong liking; "penchant for" is the standard construction.' },
        { id: 'd3v10', type: 'completion', skills: ['vocab-completion', 'w:engrossing', 'w:deft'], prompt: 'The lecture was so ------- that the students, expecting to be bored, were surprised to find the hour had passed; the professor\'s ------- storytelling had held them.', choices: [['A', 'vacuous . . demure'], ['B', 'engrossing . . deft'], ['C', 'transient . . prolific'], ['D', 'replete . . malleable']], answer: 'B', explain: '<b>engrossing . . deft</b> — the students were absorbed (positive, contradicting "expecting to be bored"), and the skillful storytelling explains why. (A) is negative in both blanks; (C) and (D) do not fit the sentence\'s logic.' },
        { id: 'd3a1', type: 'analogy', skills: ['analogy-bridge', 'w:deft', 'w:demure'], prompt: 'Deft is to clumsy as', choices: [['A', 'judicious is to careful'], ['B', 'prolific is to productive'], ['C', 'demure is to bold'], ['D', 'transient is to brief'], ['E', 'replete is to full']], answer: 'C', explain: 'Bridge: <i>deft</i> is the opposite of <i>clumsy</i>. Demure (shy, reserved) is the opposite of bold. The other pairs are synonyms.' },
        { id: 'd3a2', type: 'analogy', skills: ['analogy-bridge', 'w:pedagogue'], prompt: 'Pedagogue is to teach as', choices: [['A', 'surgeon is to operate'], ['B', 'student is to grade'], ['C', 'author is to read'], ['D', 'critic is to perform'], ['E', 'patient is to diagnose']], answer: 'A', explain: 'Bridge: a <i>pedagogue</i>\'s job is to <i>teach</i>. A surgeon\'s job is to operate. In the other pairs the action is done <i>to</i> or <i>by someone other than</i> the first word.' },
        { id: 'd3a3', type: 'analogy', skills: ['analogy-bridge', 'w:enigma', 'w:parody'], prompt: 'Enigma is to puzzling as', choices: [['A', 'tome is to brief'], ['B', 'crypt is to lively'], ['C', 'parody is to mocking'], ['D', 'precedent is to novel'], ['E', 'ruse is to honest']], answer: 'C', explain: 'Bridge: an <i>enigma</i> is by definition <i>puzzling</i>. A parody is by definition mocking. The other pairs give a quality the first word lacks.' },
        { id: 'd3a4', type: 'analogy', skills: ['analogy-bridge', 'w:squander'], prompt: 'Squander is to money as', choices: [['A', 'hoard is to shortage'], ['B', 'waste is to time'], ['C', 'earn is to salary'], ['D', 'belittle is to praise'], ['E', 'rue is to celebration']], answer: 'B', explain: 'Bridge: to <i>squander</i> is to waste <i>money</i>. To waste is to waste time — the same action applied to a comparable resource. (D) and (E) are antonym pairs, a different relationship.' },
        { id: 'd3a5', type: 'analogy', skills: ['analogy-bridge', 'w:belittle', 'w:usurp'], prompt: 'Belittle is to praise as', choices: [['A', 'ameliorate is to improve'], ['B', 'usurp is to surrender'], ['C', 'culminate is to end'], ['D', 'delineate is to outline'], ['E', 'engross is to absorb']], answer: 'B', explain: 'Bridge: <i>belittle</i> is the opposite of <i>praise</i>. Usurp (seize) is the opposite of surrender. The other pairs are synonyms.' },
        { id: 'd3a6', type: 'analogy', skills: ['analogy-bridge', 'w:transient', 'w:malleable'], prompt: 'Transient is to permanence as', choices: [['A', 'malleable is to rigidity'], ['B', 'vacuous is to emptiness'], ['C', 'solicitous is to concern'], ['D', 'prolific is to abundance'], ['E', 'incorrigible is to stubbornness']], answer: 'A', explain: 'Bridge: something <i>transient</i> lacks <i>permanence</i>. Something malleable lacks rigidity. In (B) through (E), the noun is the quality the adjective <i>has</i>.' },
      ],
    },
    {
      id: 'sep1_d3_secondpass', day: 'Day 3 · Thu Sept 3', availableFrom: '2026-09-03', order: 110,
      title: 'Second Pass — Test Innovators', subtitle: 'Every question missed on Wednesday, in a fresh form', scoring: 'none', timeLimitS: null, dynamicFrom: ['sep1_d2_review_ssat','sep1_d2_review_qr','sep1_d2_review_ma'],
      intro: [{ type: 'directions', html: '<b>Directions:</b> This set is built automatically from Wednesday\'s three review sets — every question answered incorrectly, presented again with the same structure. Answer every question. A question missed both days needs a new error-log line beginning <i>"Different this time:"</i> that names what changed.' }],
      items: [],
    },

    /* ==================== DAY 4 ==================== */
    {
      id: 'sep1_d4_card', day: 'Day 4 · Fri Sept 4', availableFrom: '2026-09-04', order: 120,
      title: 'Test-Day Card — SSAT Upper Level, Saturday', subtitle: 'Rest day · read once, aloud', scoring: 'none', timeLimitS: null, type: 'card',
      html: '<p><b>Say before each section:</b> <i>"This is the SSAT. Right +1, wrong −¼, blank 0. I guess only after eliminating two."</i></p><h4>Pacing</h4><ul><li><b>Quantitative (25 questions per section):</b> about one minute each. Minutes left on the section timer beyond 25 are the review reserve — for flagged questions, not new ones.</li><li><b>Reading (40 questions, 40 minutes):</b> five minutes per passage, all passages reached. Forty-five seconds is the cap on any single question; past that, mark the best of what is left or leave it blank and move on.</li><li><b>Verbal (60 questions, 30 minutes):</b> thirty seconds each. Synonyms first pass fast; analogies get the bridge sentence before the choices.</li></ul><h4>Rituals that hold under pressure</h4><ul><li><b>Reading:</b> "The author\'s point is ___" before the questions; finger on the proving line for every detail question; matter-of-fact is the default tone for science writing.</li><li><b>Quantitative:</b> re-read the last sentence before marking; the intermediate number is usually a choice. Function notation: solve the argument first. Scaling: lengths ×k, areas ×k², volumes ×k³. Percent changes multiply.</li><li><b>Verbal:</b> charge first (+/−), part of speech second, then eliminate. Two eliminations make the guess worth taking; fewer means blank.</li><li><b>Unknown word:</b> roots and prefixes, then charge, then eliminate — the strategy only needs to remove two choices.</li></ul><h4>After the test</h4><ul><li>Enter answers on the platform. Turn <b>Review Mode off</b> before saving each missed-question PDF so the solution is included.</li><li>The test is finished when the error log is written — every miss, one line each, before any analysis is read.</li></ul>',
      items: [],
    },
  ],

  figures: {
    hist_books: '<svg viewBox="0 0 340 230" width="340" height="230" role="img" aria-label="Histogram of books read"><line class="ax" x1="50" y1="180" x2="336" y2="180"/><line class="ax" x1="50" y1="180" x2="50" y2="20"/><line class="tk" x1="46" y1="180" x2="50" y2="180"/><text x="42" y="184" font-size="11" text-anchor="end">0</text><line class="tk" x1="46" y1="160" x2="50" y2="160"/><text x="42" y="164" font-size="11" text-anchor="end">1</text><line class="tk" x1="46" y1="140" x2="50" y2="140"/><text x="42" y="144" font-size="11" text-anchor="end">2</text><line class="tk" x1="46" y1="120" x2="50" y2="120"/><text x="42" y="124" font-size="11" text-anchor="end">3</text><line class="tk" x1="46" y1="100" x2="50" y2="100"/><text x="42" y="104" font-size="11" text-anchor="end">4</text><line class="tk" x1="46" y1="80" x2="50" y2="80"/><text x="42" y="84" font-size="11" text-anchor="end">5</text><line class="tk" x1="46" y1="60" x2="50" y2="60"/><text x="42" y="64" font-size="11" text-anchor="end">6</text><line class="tk" x1="46" y1="40" x2="50" y2="40"/><text x="42" y="44" font-size="11" text-anchor="end">7</text><line class="tk" x1="46" y1="20" x2="50" y2="20"/><text x="42" y="24" font-size="11" text-anchor="end">8</text><rect class="bar" x="60" y="120" width="36" height="60"/><text x="78" y="196" font-size="12" text-anchor="middle">0</text><rect class="bar" x="106" y="80" width="36" height="100"/><text x="124" y="196" font-size="12" text-anchor="middle">1</text><rect class="bar" x="152" y="40" width="36" height="140"/><text x="170" y="196" font-size="12" text-anchor="middle">2</text><rect class="bar" x="198" y="60" width="36" height="120"/><text x="216" y="196" font-size="12" text-anchor="middle">3</text><rect class="bar" x="244" y="140" width="36" height="40"/><text x="262" y="196" font-size="12" text-anchor="middle">4</text><rect class="bar" x="290" y="160" width="36" height="20"/><text x="308" y="196" font-size="12" text-anchor="middle">5</text><text x="198" y="216" font-size="12" text-anchor="middle">Number of books read</text><text transform="translate(14,100) rotate(-90)" font-size="12" text-anchor="middle">Number of students</text></svg>',
    pie_lunch: '<svg viewBox="0 0 330 215" width="330" height="215" role="img" aria-label="Pie chart of favorite lunch"><path class="bar" d="M110,105 L110.0,20.0 A85,85 0 0,1 178.8,155.0 Z"/><text x="158.5" y="84.3" font-size="11" text-anchor="middle">35%</text><text x="215" y="40" font-size="13">Pizza — 35%</text><path class="bar" d="M110,105 L178.8,155.0 A85,85 0 0,1 60.0,173.8 Z"/><text x="118.5" y="162.7" font-size="11" text-anchor="middle">25%</text><text x="215" y="68" font-size="13">Tacos — 25%</text><path class="bar" d="M110,105 L60.0,173.8 A85,85 0 0,1 26.5,120.9 Z"/><text x="64.1" y="138.1" font-size="11" text-anchor="middle">12%</text><text x="215" y="96" font-size="13">Salad — 12%</text><path class="bar" d="M110,105 L26.5,120.9 A85,85 0 0,1 29.2,78.7 Z"/><text x="55.7" y="105.6" font-size="11" text-anchor="middle">8%</text><text x="215" y="124" font-size="13">Soup — 8%</text><path class="bar" d="M110,105 L29.2,78.7 A85,85 0 0,1 110.0,20.0 Z"/><text x="78.0" y="65.0" font-size="11" text-anchor="middle">20%</text><text x="215" y="152" font-size="13">Other — 20%</text><text x="110" y="208" font-size="12" text-anchor="middle" font-style="italic">Favorite lunch, 200 students</text></svg>',
  },
};
