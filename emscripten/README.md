# AdLibido - WebAudio plugin of AdPlug

Copyright (C) 2014 Juergen Wothke
		
This is a JavaScript/WebAudio plugin of AdPlug. This plugin is designed to work with my 
generic WebAudio ScriptProcessor music player (see separate project). 

AdLibido is based on "adplug-2.2.1". Some unused folders have been completely removed: "adplugdb", doc", "test". The "libbinio" dependency has dierectly been included. 

Everything needed for the WebAudio version is contained in this "emscripten" folder. The 
original AdPlug code is completely unchanged (except for required bug fixes), i.e. should be trivial to merge future AdPlug 
fixes or updates.


## Howto build
You'll need Emscripten (http://kripken.github.io/emscripten-site/docs/getting_started/downloads.html). The make script 
is designed for use of emscripten version 1.37.29 (unless you want to create WebAssembly output, older versions might 
also still work).

The below instructions assume that the adplug-2.2.1 project folder has been moved into the main emscripten 
installation folder (maybe not necessary) and that a command prompt has been opened within the 
project's "emscripten" sub-folder, and that the Emscripten environment vars have been previously 
set (run emsdk_env.bat).

The Web version is then built using the makeEmscripten.bat that can be found in this folder. The 
script will compile directly into the "emscripten/htdocs" example web folder, were it will create 
the backend_adplug.js library. The content of the "htdocs" can be tested by first copying into some 
document folder of a web server (this running example shows how the code is used). 


## Dependencies
The current version requires version 1.02 (older versions will not
support WebAssembly) of my https://github.com/wothke/webaudio-player.


## Background information
Because the original implementation was not touched, the code doesn't cope with the async file 
loading approach normally taken by web apps. (You might want to have a look at my WebUADE for an 
example of a lib that has been patched to deal with load-on-demand..) This means that whenever 
some portion of the library tries to load something this cannot be handled as a load-on-demand 
but the respective file must already have been loaded previously - so that it is immediately 
available when the lib looks for it.

Fortunately ApPlug makes little use of additional file loading and most of it can be dealt with
by doing a simple pre-load, e.g. "insts.dat" (needed for KSM), "standard.bnk" (needed for ROL?),
"adplug.db" (see "htdocs/res" folder). The only problematic case seems to be the "SCI" player 
because it relies on "*patch.003" files that are actually specific to each music file. As a 
workaround I'd suggest to include the respective resource files in your playlist such that they 
will get loaded before the music file that depends on it.

## License
This library is free software; you can redistribute it and/or modify it
under the terms of the GNU Lesser General Public License as published by
the Free Software Foundation; either version 2.1 of the License, or (at
your option) any later version. This library is distributed in the hope
that it will be useful, but WITHOUT ANY WARRANTY; without even the implied
warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public
License along with this library; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301 USA

