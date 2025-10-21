import { Hono } from 'hono';
import prisma from '../../prisma/client.ts';
import type { ErrorResponse } from '../types/index.ts';
import { ethers } from 'ethers';

const webhookRoutes = new Hono();

/**
 * POST /api/v1/webhook/usdt-incoming
 * Handle incoming USDT payment notifications
 *
 * Expected payload:
 * {
 *   address: string,      // Merchant's wallet address (to)
 *   tx_hash: string,      // Transaction hash
 *   amount: string,       // Amount in USDT
 *   from: string,         // Customer's address
 *   token: string,        // Token address
 *   chain: string         // blockchain network
 * }
 */
webhookRoutes.post('/usdt-incoming', async (c) => {
  try {
    // In production, verify webhook signature/API key
    const apiKey = c.req.header('X-API-Key');
    const expectedKey = Deno.env.get('WEBHOOK_API_KEY');

    if (expectedKey && apiKey !== expectedKey) {
      const errorResponse: ErrorResponse = {
        error: 'UNAUTHORIZED',
        message: 'Invalid API key'
      };
      return c.json(errorResponse, 401);
    }

    const payload = await c.req.json();
    const { address, tx_hash, amount, from, token, chain } = payload;

    // Log webhook
    await prisma.webhooksLogs.create({
      data: {
        payload: JSON.stringify(payload),
        source: 'usdt-incoming',
        processed: false
      }
    });

    // Find user by wallet address
    const wallet = await prisma.wallets.findUnique({
      where: { address }
    });

    if (!wallet) {
      console.warn(`Wallet not found for address: ${address}`);
      return c.json({ success: false, message: 'Wallet not found' }, 404);
    }

    // Check if transaction already exists
    const existingTx = await prisma.transactions.findUnique({
      where: { txHash: tx_hash }
    });

    if (existingTx) {
      console.log(`Transaction already recorded: ${tx_hash}`);
      return c.json({ success: true, message: 'Transaction already recorded' });
    }

    // Create transaction record
    const transaction = await prisma.transactions.create({
      data: {
        userId: wallet.userId,
        txHash: tx_hash,
        timestamp: new Date(),
        type: 'receive',
        fromAddress: from,
        toAddress: address,
        amount: ethers.parseUnits(amount, 6).toString(), // Store as smallest unit
        token: 'USDT',
        status: 'confirmed',
        confirmations: 1
      }
    });

    // Mark webhook as processed
    await prisma.webhooksLogs.updateMany({
      where: {
        payload: JSON.stringify(payload),
        processed: false
      },
      data: {
        processed: true
      }
    });

    console.log(`✅ Incoming payment recorded: ${amount} USDT to ${address}`);

    return c.json({
      success: true,
      transaction_id: transaction.id,
      message: 'Payment recorded'
    });
  } catch (error: any) {
    console.error('Webhook error:', error);

    const errorResponse: ErrorResponse = {
      error: 'WEBHOOK_PROCESSING_FAILED',
      message: error.message || 'Failed to process webhook',
      details: error
    };
    return c.json(errorResponse, 500);
  }
});

/**
 * POST /api/v1/webhook/transaction-update
 * Handle transaction status updates (confirmations, etc.)
 */
webhookRoutes.post('/transaction-update', async (c) => {
  try {
    const apiKey = c.req.header('X-API-Key');
    const expectedKey = Deno.env.get('WEBHOOK_API_KEY');

    if (expectedKey && apiKey !== expectedKey) {
      return c.json({ error: 'UNAUTHORIZED', message: 'Invalid API key' }, 401);
    }

    const payload = await c.req.json();
    const { tx_hash, status, confirmations } = payload;

    // Update transaction status
    const transaction = await prisma.transactions.update({
      where: { txHash: tx_hash },
      data: {
        status,
        confirmations
      }
    });

    return c.json({ success: true, transaction_id: transaction.id });
  } catch (error: any) {
    const errorResponse: ErrorResponse = {
      error: 'UPDATE_FAILED',
      message: error.message || 'Failed to update transaction',
      details: error
    };
    return c.json(errorResponse, 500);
  }
});

export default webhookRoutes;
