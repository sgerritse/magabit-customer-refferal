-- Update Day 1 challenge with proper HTML formatting
UPDATE challenges 
SET 
  description = '<p>Sit with your child and tell them: <strong>"I joined DadderUp because I want to be the best version of myself—for you."</strong></p>

<p>Say it simply. Clearly. Out loud.</p>

<p>This moment anchors your journey and lets them know they''re your ''why.'' Look them in the eyes when you say it - this builds the foundation of your commitment to being better.</p>',
  video_url = 'https://www.youtube.com/watch?v=yAfw5MATVCw',
  tip = 'Speak from the heart. Your sincerity matters more than perfect words.'
WHERE challenge_id = '1';

-- Update Day 2 challenge with proper HTML formatting
UPDATE challenges 
SET 
  description = '<p>Tell your child the story of <strong>the day they were born</strong>—or the first time you met them.</p>

<p>Describe how it felt to hold them or see them for the first time. Include specific details like what you were wearing, the weather, or how small their hands were.</p>

<p><strong>Kids love these intimate details.</strong></p>',
  tip = 'The more vivid the details, the more powerful the connection. Paint the picture with your words.'
WHERE challenge_id = '2';

-- Update Day 3 challenge with proper HTML formatting
UPDATE challenges 
SET 
  description = '<p>Record a short video of yourself (30–60 seconds) saying <strong>why you joined DadderUp</strong> and <strong>two things you love most</strong> about your kid(s).</p>

<p>Post it and tag <strong>@DadderUp</strong>.</p>

<p>Speak from the heart, not from a script. <em>Authenticity matters more than perfection.</em></p>',
  tip = 'Don''t worry about production quality. Raw and real beats polished and scripted every time.'
WHERE challenge_id = '3';

-- Update Day 4 challenge with proper HTML formatting
UPDATE challenges 
SET 
  description = '<p>Write a <strong>one-sentence vision</strong> of the kind of father you want to be by next year.</p>

<p>Say it out loud while looking in the mirror.</p>

<p>Make it specific and personal. Instead of "be a good dad," try <strong>"be the dad who listens first and speaks second."</strong></p>',
  tip = 'Your vision should challenge you but also feel achievable. Make it something you can measure.'
WHERE challenge_id = '4';

-- Update Day 5 challenge with proper HTML formatting
UPDATE challenges 
SET 
  description = '<p>Choose a phrase that will be <strong>your mantra</strong> for this season (e.g., "Show up anyway," "Calm is the flex," "Legacy, not noise.").</p>

<p>Write it down and post it somewhere visible.</p>

<p>Pick something that resonates with your biggest parenting challenge right now.</p>',
  tip = 'Your mantra should be short enough to remember in tough moments but powerful enough to shift your mindset.'
WHERE challenge_id = '5';

-- Update Day 6 challenge with proper HTML formatting
UPDATE challenges 
SET 
  description = '<p>Create a <strong>DadderUp DDS Board</strong> in your home (like a chore board).</p>

<p>Every time you log a Flex, let your child mark an "X" or sticker. At the end of the month, celebrate together.</p>

<p>Make it visual and fun. <strong>Kids love being part of your progress</strong> and seeing tangible results.</p>',
  tip = 'Let your kids help design the board. Their involvement makes them invested in your journey.'
WHERE challenge_id = '6';

-- Update Day 7 challenge with proper HTML formatting
UPDATE challenges 
SET 
  description = '<p>Give your child a small, sentimental item (or <strong>DadderUp Coin</strong> if received) and say:</p>

<p><strong>"This is a symbol of how seriously I take being your dad."</strong></p>

<p>Let it anchor your commitment. Choose something meaningful they can keep with them.</p>

<p>This becomes a physical reminder of your commitment to growth.</p>',
  tip = 'The item doesn''t have to be expensive. What matters is the meaning you attach to it together.'
WHERE challenge_id = '7';