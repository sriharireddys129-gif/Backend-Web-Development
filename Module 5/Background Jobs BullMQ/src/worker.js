'use strict';

const { Worker } = require('bullmq');
const { connection } = require('./queue');
const transporter = require('./email');

const worker = new Worker(
  'email',
  async (job) => {
    if (job.name === 'otp') {
      await transporter.sendMail({
        to: job.data.to,
        subject: 'Your Email Verification OTP',
        text: `Your OTP is ${job.data.otp}. It is valid for 10 minutes.`
      });
    }
  },
  {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000
      }
    }
  }
);

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed: ${err.message}`);
});

module.exports = worker;