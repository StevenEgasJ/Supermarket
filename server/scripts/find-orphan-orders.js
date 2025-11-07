// Usage: node server/scripts/find-orphan-orders.js
// Finds orders that reference a userId that doesn't exist in users collection.
require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/el-valle';

async function main() {
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to', MONGODB_URI);

  const orders = await Order.find().lean();
  const orphans = [];
  for (const o of orders) {
    const uid = o.userId;
    if (!uid) continue;
    const exists = await User.exists({ _id: uid });
    if (!exists) orphans.push({ orderId: o._id, userId: uid });
  }

  if (orphans.length === 0) {
    console.log('No orphaned orders found.');
  } else {
    console.log('Orphaned orders (orderId -> missing userId):');
    orphans.forEach(x => console.log(String(x.orderId), '->', String(x.userId)));
  }

  mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
