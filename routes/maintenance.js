const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// GET all maintenance records
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('maintenance')
      .select(`
        *,
        customers(company_name),
        licenses(license_key)
      `)
      .order('scheduled_date', { ascending: false });
    
    if (error) throw error;
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET maintenance records by customer
router.get('/customer/:customerId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('maintenance')
      .select('*')
      .eq('customer_id', req.params.customerId)
      .order('scheduled_date', { ascending: false });
    
    if (error) throw error;
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET single maintenance record
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('maintenance')
      .select(`
        *,
        customers(company_name, contact_person),
        licenses(license_key, license_type)
      `)
      .eq('id', req.params.id)
      .single();
    
    if (error) throw error;
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// CREATE maintenance record
router.post('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('maintenance')
      .insert([req.body])
      .select();
    
    if (error) throw error;
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// UPDATE maintenance record
router.put('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('maintenance')
      .update(req.body)
      .eq('id', req.params.id)
      .select();
    
    if (error) throw error;
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE maintenance record
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('maintenance')
      .delete()
      .eq('id', req.params.id);
    
    if (error) throw error;
    
    res.json({ success: true, message: 'Maintenance record deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
