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
    console.log(' Fetching jobs for userId:', userId);
    const data = await docClient.query(params).promise();
    console.log(' Successfully fetched jobs:', data.Items.length, 'items');
    res.json(data.Items);
  } catch (err) {
    console.error("Critical Database Error:", err);
    console.error("Error details:", {
      message: err.message,
      code: err.code,
      statusCode: err.statusCode,
      requestId: err.requestId
    });
    
    // Single dummy job for all users to prevent frontend from breaking
    const fallbackData = [
      {
        _id: 'demo-job-' + userId.substring(0, 8),
        applicationId: uuidv4(),
        company: 'Demo Company',
        position: 'Software Engineer',
        status: 'Applied',
        location: 'Remote',
        salary: '$120k-$150k',
        notes: 'Demo job - Database connection issue',
        dateApplied: new Date().toISOString(),
        userId: userId
      }
    ];
    
    console.log(' Returning demo data for user:', userId);
    res.status(200).json(fallbackData);
  }
};

exports.createJob = async (req, res) => {
  const userId = req.user.sub;
  const { company, position, status, location, salary, notes } = req.body;
  
  console.log(' Creating job:', { company, position, status, location, salary, notes });
  
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
    console.log(' Saving job to database:', newJob);
    await docClient.put({ TableName: TABLE_NAME, Item: newJob }).promise();
    console.log(' Job saved successfully:', newJob.applicationId);
    res.status(201).json(newJob);
  } catch (err) {
    console.error("Critical Database Error (Create):", err);
    console.error("Error details:", {
      message: err.message,
      code: err.code,
      statusCode: err.statusCode,
      requestId: err.requestId
    });

    // No dummy data: frontend will show an error.
    return res.status(500).json({
      message: err?.message || "Failed to save job to database",
    });
  }
};

const ALLOWED_STATUSES = new Set(["Applied", "Interview", "Offer", "Rejected", "Ghosted"]);

async function findUserJobOrNull(userId, jobId) {
  const params = {
    TableName: TABLE_NAME,
    KeyConditionExpression: "userId = :uid",
    ExpressionAttributeValues: { ":uid": userId },
  };

  const data = await docClient.query(params).promise();
  const items = Array.isArray(data?.Items) ? data.Items : [];

  // Frontend sends job._id as :id, but we also support applicationId for safety.
  const found =
    items.find((it) => String(it?._id) === String(jobId)) ||
    items.find((it) => String(it?.applicationId) === String(jobId)) ||
    null;

  return found;
}

exports.updateJobStatus = async (req, res) => {
  const userId = req.user.sub;
  const jobId = req.params.id;
  const nextStatus = req.body?.status;

  if (!jobId) return res.status(400).json({ message: "Missing job id" });
  if (!nextStatus) return res.status(400).json({ message: "Missing status" });
  if (!ALLOWED_STATUSES.has(nextStatus)) {
    return res.status(400).json({ message: `Invalid status: ${nextStatus}` });
  }

  try {
    const found = await findUserJobOrNull(userId, jobId);
    if (!found) return res.status(404).json({ message: "Job not found" });

    const updatedItem = {
      ...found,
      status: nextStatus,
      // optional metadata; safe even if your table doesn't expect it
      lastStatusUpdateAt: new Date().toISOString(),
    };

    // PutItem avoids needing to know which attribute is your DynamoDB sort key
    await docClient.put({ TableName: TABLE_NAME, Item: updatedItem }).promise();

    return res.json(updatedItem);
  } catch (err) {
    console.error("Critical Database Error (Update):", err);
    return res.status(500).json({ message: err.message || "Failed to update job status" });
  }
};

exports.deleteJob = async (req, res) => {
  const userId = req.user.sub;
  const jobId = req.params.id;

  if (!jobId) return res.status(400).json({ message: "Missing job id" });

  try {
    const found = await findUserJobOrNull(userId, jobId);
    if (!found) return res.status(404).json({ message: "Job not found" });

    if (!found.applicationId) {
      return res.status(500).json({ message: "Missing applicationId for delete key" });
    }

    // DynamoDB key schema:
    //   PK: userId (String)
    //   SK: applicationId (String)
    await docClient
      .delete({
        TableName: TABLE_NAME,
        Key: { userId, applicationId: found.applicationId },
      })
      .promise();

    return res.status(204).send();
  } catch (err) {
    console.error("Critical Database Error (Delete):", err);
    return res.status(500).json({ message: err.message || "Failed to delete job" });
  }
};