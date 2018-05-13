// additional emscripten *.js library must be in this dumbshit format..
mergeInto(LibraryManager.library, {
	// returns 0 means file is ready; -1 if file is not yet available; 1 if file does not exist
	adlib_request_file: function(name) {	
		return window['fileRequestCallback'](name);
	},
});