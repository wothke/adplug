# AdLibido - WebAudio plugin of AdPlug

Copyright (C) 2014 Juergen Wothke
		
This is a JavaScript/WebAudio plugin of AdPlug. This plugin is designed to work with my generic WebAudio 
ScriptProcessor music player (see separate project) but the API exposed by the lib can be used in any 
JavaScript program (it should look familiar to anyone that has ever done some sort of music player plugin). 

AdLibido is based on "adplug-2.2.1". Some unused folders have been completely removed: "adplugdb", doc", "test". The "libbinio" 
dependency has directly been included. 

Everything needed for the WebAudio version is contained in this "emscripten" folder. The 
original AdPlug code is mostly unchanged (except for required bug fixes & minor API changes to allow for the propagation of 
"file not ready" information), i.e. should be trivial to merge future AdPlug fixes or updates.

The lib supports loading of remote music files (also multi-part files) and is equipped with respective 
asynchronous "load on demand" logic.


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
Recommended use of version 1.03 of my https://github.com/wothke/webaudio-player (older versions will not
support WebAssembly and the playback of remote files)


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

