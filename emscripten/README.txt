AdLibido - WebAudio plugin of AdPlug
========

	Copyright (C) 2014 Juergen Wothke

	LICENSE
		See individual files for specific licensing information

		
This is a JavaScript/WebAudio plugin of AdPlug. This plugin is designed to work with version 1.0 of my 
generic WebAudio ScriptProcessor music player (see separate project). 

AdLibido is based on "adplug-2.2.1". Some unused folders have been completely removed: "adplugdb", doc", "test". The "libbinio" dependency has dierectly been included. 

Everything needed for the WebAudio version is contained in this "emscripten" folder. The 
original AdPlug code is completely unchanged, i.e. should be trivial to merge future AdPlug 
fixes or updates.


You'll need Emscripten (I used the win installer on WinXP: emsdk-1.13.0-full-32bit.exe which 
could - at the time - be found here: http://kripken.github.io/emscripten-site/docs/getting_started/downloads.html) 

I did not need to perform ANY additions or manual changes on the installation. The below 
instructions assume that the adplug-2.2.1 project folder has been moved into the main emscripten 
installation folder (maybe not necessary) and that a command prompt has been opened within the 
project's "emscripten" sub-folder, and that the Emscripten environment vars have been previously 
set (run emsdk_env.bat).


Howto build:

The Web version is built using the makeEmscripten.bat that can be found in this folder. The 
script will compile directly into the "emscripten/htdocs" example web folder, were it will create 
the backend_adplug.js library. The content of the "htdocs" can be tested by first copying into some 
document folder of a web server (this running example shows how the code is used). 


Background information:

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
