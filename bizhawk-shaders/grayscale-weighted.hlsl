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
  float4 temp = tex2D(s_p, texcoord); 

  // Using tex2D_object.r (.g, .b) will give the red (blue, green) values for that pixel.  I think it goes through all the pixels, as well.
  float1 colorValue = (0.3 * temp.r) + (0.59 * temp.g) + (0.11 * temp.b);
  temp.r = colorValue;
  temp.g = colorValue;
  temp.b = colorValue;
  return temp;
}