# bizhawk-shaders
Various shaders for bizhawk made in HLSL.  Mainly for accessibility purposes.

## How to Use this.

1. Download this repo.
2. Open Bizhawk. 
3. Go to Config > Display and look at "Scaling Filter" on the left.  
4. Click "User" and then "Select" and select the `.cgp` file with the name you want.
5. That's it.  When you wanna remove it, go back and select "None" from Scaling Filter.

## Work In Progress.

Often, I'm not sure what I'm doing.  This is the case here, certainly.

The shaders for Bizhawk, using DirectX mode, are made with HLSL, which is a language that is used for shading ("High-Level Shader Language").  From what I've read, this is essentially (if not entirely) equivalent to the now-deprecated "Cg" language.  Nevertheless, to say the documentation is lacking is an understatement: I've pieced this together from looking at a few examples and some Cg guides as well as the archives of some now-deleted websites.

It sort of feels like an archaeological dig.

## So, what is this?

This is my attempt at making and heavily documenting a few HLSL code-snippets.  Actually, this will be a byproduct of the primary goal: to make filters which allow players with accessibility issues (photosensitivity, sensory processing sensitivity, flashing-light sensitivity, etc.) to be able to play games on the BizHawk emulator.

## Will these work with (my emulator of choice)?

Truly, I have no idea.  The rumblings seem to say: Retroarch requires a lot of strange things in their shader files which make it so that this kind of HLSL cannot be used, but I've not tested it on anything except BizHawk.