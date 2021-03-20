// This is kind of gross right now, and I'm not sure why but
// a little flickery.  Check out the calculations.

void main_vertex
(
   float4 position : POSITION,
   float2 tex : TEXCOORD0,

   uniform float4x4 modelViewProj,

   out float4 oPosition : POSITION,
   out float2 oTexcoord : TEXCOORD0
)
{
  // This function seems to be a standard method that gets the input.
  // I didn't change any of this and it seems to work.
	oPosition = mul(modelViewProj, position);
	oTexcoord = tex;
}

float4 main_fragment (in float2 texcoord : TEXCOORD0, uniform sampler2D s_p : TEXUNIT0) : COLOR
{
  // This function seems to post things to a standard output.
  float4 t = tex2D(s_p, texcoord); 

  // Using tex2D_object.r (.g, .b) will give the red (blue, green) values for that pixel.  I think it goes through all the pixels, as well.
  float1 rNorm = t.r / 255;
  float1 gNorm = t.g / 255;
  float1 bNorm = t.b / 255;
  float1 cMax = max(rNorm, max(gNorm, bNorm));
  float1 cMin = min(rNorm, max(gNorm, bNorm));
  float1 delta = cMax - cMin;
  float1 hue;
  float1 saturation;
  float1 value;

  // https://www.rapidtables.com/convert/color/rgb-to-hsv.html
  if (cMax == rNorm) {
    hue = 60 * (((gNorm - bNorm) / delta) % 6);
  } else if (cMax == gNorm) {
    hue = 60 * (((bNorm - rNorm) / delta) + 2);
  } else if (cMax == bNorm) {
    hue = 60 * (((rNorm - gNorm) / delta) + 4);
  };

  if (cMax != 0) {
    saturation = (delta / cMax);
  } else {
    saturation = 0;
  };

  value = cMax;


  float1 newSaturation = 0.5 * saturation;
  float1 newR;
  float1 newG;
  float1 newB;
  float1 C = value * newSaturation;
  float1 X = C * (1 - abs(((hue / 60) % 2) - 1));
  float1 m = value - C;

  if ((hue >= 0) && (hue < 60)) {
    newR = C;
    newG = X;
    newB = 0;
  } else if ((hue >= 60) && (hue < 120)) {
    newR = X;
    newG = C;
    newB = 0;
  } else if ((hue >= 120) && (hue < 180)) {
    newR = 0;
    newG = C;
    newB = X;
  } else if ((hue >= 180) && (hue < 240)) {
    newR = 0;
    newG = X;
    newB = C;
  } else if ((hue >= 240) && (hue < 300)) {
    newR = X;
    newG = 0;
    newB = C;
  } else if ((hue >= 300) && (hue < 360)) {
    newR = C;
    newG = X;
    newB = 0;
  } else {
    newR = 1;
    newG = 1;
    newB = 1;
  }
  
  t.r = 255 * (newR + m);
  t.g = 255 * (newG + m);
  t.b = 255 * (newB + m);
  return t;
}