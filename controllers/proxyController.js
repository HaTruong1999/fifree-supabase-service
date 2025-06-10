export const handleProxyRequest = async (req, res) => {
  const fileUrl = req.query.url;
  if (!fileUrl) {
    return res.status(400).send('Missing "url" query param');
  }

  try {
    const response = await fetch(fileUrl);

    if (!response.ok) {
      return res.status(500).send('Failed to fetch file from source');
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const buffer = await response.arrayBuffer();

    res.set({
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
    });

    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).send('Error fetching file');
  }
};
