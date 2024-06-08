const express = require('express');
const axios = require('axios');

const app = express();
const port = 9876;
const windowSize = 10;
const testServerUrl = 'http://20.244.56.144/test';

const windows = {
  p: [],
  f: [],
  e: [],
  r: []
};

const fetchNumbers = async (type) => {
  const url = `${testServerUrl}/${type}`;
  try {
    const response = await axios.get(url, { timeout: 500 });
    return response.data.numbers;
  } catch (error) {
    console.error(`Failed to fetch ${type} numbers:`, error.message);
    return [];
  }
};

const calculateAverage = (numbers) => {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, num) => acc + num, 0);
  return (sum / numbers.length).toFixed(2);
};

app.get('/numbers/:numberid', async (req, res) => {
  const { numberid } = req.params;

  if (!['p', 'f', 'e', 'r'].includes(numberid)) {
    return res.status(400).json({ error: 'Invalid number ID' });
  }

  const prevState = [...windows[numberid]];
  const numbers = await fetchNumbers(numberid);
  const uniqueNumbers = Array.from(new Set(numbers));

  windows[numberid] = [...windows[numberid], ...uniqueNumbers].slice(-windowSize);

  const currState = windows[numberid];
  const avg = calculateAverage(currState);

  res.json({
    numbers,
    windowPrevState: prevState,
    windowCurrState: currState,
    avg
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});