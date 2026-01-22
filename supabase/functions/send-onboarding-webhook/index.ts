import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { firstName, lastName, email, phone, isLicensed, agencyCode, assignedManager, referredBy } = await req.json();

    console.log('Sending onboarding webhook for:', email);

    // Send data to webhook
    const webhookUrl = 'https://services.leadconnectorhq.com/hooks/8QTBB0ELEbvOf31OXIdM/webhook-trigger/7676888d-9040-4f44-bb44-b6699e3238b7';
    
    const payload = {
      // Standard contact fields (camelCase for LeadConnector)
      firstName: firstName,
      lastName: lastName,
      name: `${firstName} ${lastName}`,
      email: email,
      phone: phone,
      
      // Custom fields - both formats for compatibility
      first_name: firstName,
      last_name: lastName,
      is_licensed: isLicensed,
      isLicensed: isLicensed,
      agency_code: agencyCode,
      agencyCode: agencyCode,
      assigned_manager: assignedManager,
      assignedManager: assignedManager,
      referred_by: referredBy,
      referredBy: referredBy,
      
      // Metadata
      source: "BatterBox Onboarding",
      timestamp: new Date().toISOString(),
    };

    console.log('Sending webhook payload:', JSON.stringify(payload));

    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseText = await webhookResponse.text();
    console.log('Webhook response status:', webhookResponse.status);
    console.log('Webhook response body:', responseText);

    if (!webhookResponse.ok) {
      console.error('Webhook failed:', responseText);
      throw new Error('Failed to send webhook');
    }

    console.log('Webhook sent successfully');

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in send-onboarding-webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
