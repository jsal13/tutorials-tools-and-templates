void main_vertex
(
   float4 position : POSITION,
   float2 tex : TEXCOORD0,
   uniform float4x4 modelViewProj,
   out float4 oPosition : POSITION,
   out float2 oTexcoord : TEXCOORD0
)
{
	oPosition = mul(modelViewProj, position);
	oTexcoord = tex;
}

float4 main_fragment (in float2 texcoord : TEXCOORD0, uniform sampler2D s_p : TEXUNIT0) : COLOR
{
  float4 t = tex2D(s_p, texcoord); 

  // Gameboy colors in RGB below.
  // #081820, #346856, #88c070, #e0f8d0
  float4x3 C = {
    {20, 6, 51},
    {87, 62, 143},
    {95, 67, 156},
    {170, 161, 218}
  };
  C /= 255;

  float1 minSoFar = 66000;
  int idx_ = 0;

  for (int idx = 0; idx < 4; idx++) 
  {
    // Do the Redmean calculation.
    float1 rHat = (255 / 2) * (C[idx][0] + t.r);
    float1 deltaR = (2 + (rHat / 256)) * pow(255 * (t.r - C[idx][0]), 2);
    float1 deltaG = 4 * pow(255 * (t.r - C[idx][0]), 2);
    float1 deltaB = ((2 + ((255 - rHat) / 256))) * pow(255 * (t.r - C[idx][0]), 2);
    float1 delta = deltaR + deltaG + deltaB;

    if (delta < minSoFar) 
    {
      minSoFar = delta;
      idx_ = idx;
    }
  };

  t.r = C[idx_][0];
  t.g = C[idx_][1];
  t.b = C[idx_][2];
  return t;
};