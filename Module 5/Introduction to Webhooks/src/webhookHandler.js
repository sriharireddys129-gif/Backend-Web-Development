'use strict';

const crypto = require('node:crypto');
const { handleEvent } = require('./eventHandlers');

const _processedIds = new Set();

async function handleWebhook(req, res) {
  try {
    // 1. Verify signature
    const secret = process.env.WEBHOOK_SECRET || 'testsecret';
    const signature = req.headers['x-webhook-signature'];

    if (!signature || !signature.startsWith('sha256=')) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Ensure the original raw body is available
    if (!Buffer.isBuffer(req.body)) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    // Calculate expected HMAC
    const expected = crypto
      .createHmac('sha256', secret)
      .update(req.body)
      .digest('hex');

    const received = signature.slice(7);

    // Validate signature format
    if (!/^[a-f0-9]{64}$/i.test(received)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const expectedBuffer = Buffer.from(expected, 'hex');
    const receivedBuffer = Buffer.from(received, 'hex');

    // Secure comparison
    if (!crypto.timingSafeEqual(expectedBuffer, receivedBuffer)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // 2. Parse body
    let event;

    try {
      event = JSON.parse(req.body.toString('utf8'));
    } catch (error) {
      return res.status(400).json({ error: 'Invalid JSON' });
    }

    // 3. Check duplicate event
    if (_processedIds.has(event.id)) {
      return res.status(200).json({
        status: 'already_processed'
      });
    }

    // 4. Mark event as processed
    _processedIds.add(event.id);

    // 5. Acknowledge request
    res.status(200).json({
      status: 'received'
    });

    // 6. Process asynchronously
    setImmediate(() => {
      handleEvent(event).catch(error => {
        console.error('Event processing failed:', error);
      });
    });

  } catch (error) {
    console.error('Webhook handler error:', error);

    if (!res.headersSent) {
      return res.status(500).json({
        error: 'Internal server error'
      });
    }
  }
}

module.exports = {
  handleWebhook,
  _processedIds
};