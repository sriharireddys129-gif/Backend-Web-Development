
'use strict';
// routes/payments.js

const router = require('express').Router();
const { charges, idempotency, nextChargeId } = require('../store');

router.post('/', (req, res) => {

  // 1. Read the Idempotency-Key header
  const key = req.headers['idempotency-key'];

  // 2. Reject requests without an idempotency key
  if (!key) {
    return res.status(400).json({
      error: {
        code: 'IDEMPOTENCY_KEY_REQUIRED',
        message: 'Idempotency-Key header is required'
      }
    });
  }

  // 3. If the key already exists, return the stored response
  if (idempotency.has(key)) {
    const saved = idempotency.get(key);
    return res.status(saved.status).json(saved.body);
  }

  // 4. Create a new charge
  const amount = req.body && req.body.amount;

  const charge = {
    id: nextChargeId(),
    amount,
    status: 'charged'
  };

  charges.push(charge);

  // 5. Prepare the response
  const body = {
    id: charge.id,
    amount: charge.amount,
    status: charge.status
  };

  // 6. Store the response against the idempotency key
  idempotency.set(key, {
    status: 201,
    body
  });

  // 7. Return the payment response
  return res.status(201).json(body);
});

module.exports = router;
