import { createFileRoute } from '@tanstack/react-router';
import { supabaseAdmin } from '@/integrations/supabase/client.server';
import { z } from 'zod';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const Route = createFileRoute('/api/hero/upload')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const type = formData.get('type') as 'desktop' | 'mobile';

        if (!file) {
          return new Response('No file provided', { status: 400 });
        }

        if (file.size > MAX_FILE_SIZE) {
          return new Response('File too large (max 2MB)', { status: 400 });
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
          return new Response('Invalid file type', { status: 400 });
        }

        const fileName = `${Date.now()}-${type}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const filePath = `banners/${fileName}`;

        const { data, error } = await supabaseAdmin.storage
          .from('hero-banners')
          .upload(filePath, file, {
            contentType: file.type,
            upsert: false
          });

        if (error) {
          return new Response(error.message, { status: 500 });
        }

        const { data: { publicUrl } } = supabaseAdmin.storage
          .from('hero-banners')
          .getPublicUrl(filePath);

        return new Response(JSON.stringify({ url: publicUrl }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  }
});
