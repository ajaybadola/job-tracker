const { docClient, TABLE_NAME } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

exports.getJobs = async (req, res) => {
  const userId = req.user.sub;
  const params = {
    TableName: TABLE_NAME,
    KeyConditionExpression: 'userId = :uid',
    ExpressionAttributeValues: { ':uid': userId },
  };
  try {
    const data = await docClient.query(params).promise();
    res.json(data.Items);
  } catch (err) {
    console.error('Error fetching jobs:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.createJob = async (req, res) => {
  const userId = req.user.sub;
  const { company, position, status, location, salary, notes } = req.body;
  if (!company || !position) {
    return res.status(400).json({ error: 'Company and position are required' });
  }
  const newJob = {
    userId,
    applicationId: uuidv4(),
    _id: uuidv4(),
    company, 
    position, 
    status: status || 'Applied',
    location: location || '', 
    salary: salary || '', 
    notes: notes || '',
    dateApplied: new Date().toISOString(),
  };
  try {
    await docClient.put({ TableName: TABLE_NAME, Item: newJob }).promise();
    res.status(201).json(newJob);
  } catch (err) {
    console.error('Error adding job:', err);
    res.status(500).json({ error: err.message });
  }
};