/*
* This file adapts "adplug" to the interface expected by my generic JavaScript player..
*
* Copyright (C) 2014 Juergen Wothke
*
* LICENSE
* 
* This library is free software; you can redistribute it and/or modify it
* under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 2.1 of the License, or (at
* your option) any later version. This library is distributed in the hope
* that it will be useful, but WITHOUT ANY WARRANTY; without even the implied
* warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU General Public License for more details.
* 
* You should have received a copy of the GNU General Public
* License along with this library; if not, write to the Free Software
* Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301 USA
*/

// Note: implementation approach; changed return value of CPlayer.load() from bool to char
// to let multi-file songs signal if a required file is not ready yet.. the info is then propagated 
// to the below "emu_init" using gFileNotReadyMarker. (also see EMSCRIPTEN comments)

#include "../src/adplug.h"
#include "../src/opl.h"


// note: to use one of the other OPL impls respective .cpp files must be added in the makeEmscripten.bat
//#include "../src/emuopl.h"	// CEmuopl: old MAME impl
//#include "../src/nemuopl.h"	// CNemuopl: Nuked OPL3 emulator
#include "../src/wemuopl.h"		// CWemuopl: new WoodyOPL


#include "../src/database.h"

#include "output.h"

#include <stdio.h>
#include <emscripten.h>


#include "player.h"

class FileNotReadyMarker: public CPlayer {
 public:
  FileNotReadyMarker() : CPlayer(0) {}
  ~FileNotReadyMarker() {}

  char load(const std::string &filename, const CFileProvider &fp) { return false; }
  bool update() { return false; }
  void rewind(int subsong = -1) {}
  float getrefresh() { return 0.0f; }
  std::string gettype() { return std::string("File not ready marker"); }
};
/*
#ifdef EMSCRIPTEN
#define EMSCRIPTEN_KEEPALIVE __attribute__((used))
#else
#define EMSCRIPTEN_KEEPALIVE
#endif
*/

// hack: from woodyopl.c
extern int** OPL_SCOPE_BUFFERS();
extern char OPL_RYTHM_MODE();
extern char OPL_SCOPE_CHANNELS();


#define BUF_SIZE	1024
#define TEXT_MAX	255
#define NUM_MAX	15

short	*outputBuffer=0;
Copl	*opl= 0;
BufPlayer	*player= 0;
const char* infoTexts[6];

char title_str[TEXT_MAX];
char author_str[TEXT_MAX];
char desc_str[TEXT_MAX];
char type_str[TEXT_MAX];
char tracks_str[NUM_MAX];
char speed_str[NUM_MAX];

CAdPlugDatabase *db= 0;
CPlayer *gFileNotReadyMarker;

struct StaticBlock {
    StaticBlock(){
		infoTexts[0]= title_str;
		infoTexts[1]= author_str;
		infoTexts[2]= desc_str;
		infoTexts[3]= type_str;
		infoTexts[4]= speed_str;
		infoTexts[5]= tracks_str;
		
		gFileNotReadyMarker= new FileNotReadyMarker();
    }
};

static StaticBlock staticBlock;

unsigned char isReady= 0;

unsigned long playTime= 0;
unsigned long totalTime= 0;
unsigned int sampleRate= 44100;

extern "C" void emu_teardown (void)  __attribute__((noinline));
extern "C" void EMSCRIPTEN_KEEPALIVE emu_teardown (void) {
  isReady= 0;
	
  if(player) { delete player; player= 0;}
  if(opl) { delete opl; opl= 0; }
	
  if (outputBuffer) {free(outputBuffer); outputBuffer= 0;}
}

//#include "fprovide.h"
//CProvider_Filesystem fileProvider;

extern "C" int emu_init(int sample_rate, char *basedir, char *songmodule) __attribute__((noinline));
extern "C" EMSCRIPTEN_KEEPALIVE int emu_init(int sample_rate, char *basedir, char *songmodule)
{	
	emu_teardown();
	
	outputBuffer = (short *)calloc(BUF_SIZE, sizeof(short));	
		
	std::string	filename = std::string(basedir) + songmodule;	
	
//	opl = new CEmuopl(sample_rate, true, true);	// has issues with 2 channel output
//	opl = new CNemuopl(sample_rate);
	opl = new CWemuopl(sample_rate, true, true);
		
	player= new BufPlayer(opl, 16, 2, sample_rate, BUF_SIZE);
		
	// initialize output & player
	opl->init();
	
	player->p = CAdPlug::factory(filename, opl);
//	player->p = CAdPlug::factory(filename, opl, CAdPlug::players, fileProvider);
	
	if (gFileNotReadyMarker == player->p) {
		player->p= 0;
		return -1;	// try again later
	}
			
	if (db == 0) {
		db= new CAdPlugDatabase();
//		db->load("addplug.db");		unused
	}
	CAdPlug::set_database(db);
	
	if(!player->p) {
		delete opl; 
		opl= 0; 
		return 1;	// ERROR
	}	
		
	sampleRate= sample_rate;

	return 0;
}

extern "C" int emu_set_subsong(int subsong) __attribute__((noinline));
extern "C" int EMSCRIPTEN_KEEPALIVE emu_set_subsong(int subsong)
{
	player->p->rewind(subsong);
	
	playTime= 0;
	totalTime= player->p->songlength(subsong);	// must be cached bc call corrupts playback
	
	isReady= 1;
	
	return 0;
}

extern "C" const int emu_get_num_insts() __attribute__((noinline));
extern "C" const int EMSCRIPTEN_KEEPALIVE emu_get_num_insts() {
    return (player && player->p) ? player->p->getinstruments() : 0;
}
extern "C" const char* emu_get_inst_text(unsigned int idx) __attribute__((noinline));
extern "C" const char* EMSCRIPTEN_KEEPALIVE emu_get_inst_text(unsigned int idx) {
    return (player && player->p) ? player->p->getinstrument(idx).c_str() : "";
}

extern "C" const char** emu_get_track_info() __attribute__((noinline));
extern "C" const char** EMSCRIPTEN_KEEPALIVE emu_get_track_info() {
    if (player && player->p) {
        // more Emscripten/JavaScript friendly structure..
		snprintf(title_str, TEXT_MAX, "%s", player->p->gettitle().c_str());
		snprintf(author_str, TEXT_MAX, "%s", player->p->getauthor().c_str());
		snprintf(desc_str, TEXT_MAX, "%s", player->p->getdesc().c_str());
		snprintf(type_str, TEXT_MAX, "%s", player->p->gettype().c_str());
		
		snprintf(speed_str, NUM_MAX, "%d", player->p->getspeed());
		snprintf(tracks_str, NUM_MAX, "%d",  player->p->getsubsongs());
    }
    return infoTexts;
}

extern "C" char* EMSCRIPTEN_KEEPALIVE emu_get_audio_buffer(void) __attribute__((noinline));
extern "C" char* EMSCRIPTEN_KEEPALIVE emu_get_audio_buffer(void) {
	return (char*)player->getSampleBuffer();
}

extern "C" long EMSCRIPTEN_KEEPALIVE emu_get_audio_buffer_length(void) __attribute__((noinline));
extern "C" long EMSCRIPTEN_KEEPALIVE emu_get_audio_buffer_length(void) {
	return player->getSampleBufferSize();
}

extern "C" int emu_compute_audio_samples() __attribute__((noinline));
extern "C" int EMSCRIPTEN_KEEPALIVE emu_compute_audio_samples() {
	if (!isReady) return 0;		// don't trigger a new "song end" while still initializing
	
	int i= 0;
    while (!playTime && !player->playing && i<100) { player->frame(); i++;}	// issue: "Bob's AdLib Music" song will immediately report !playing
	
    player->frame();
	playTime+= (player->getSampleBufferSize()>>2);
	
	if (player->playing) {
		return 0;
	} else {
		return 1;
	}
}

extern "C" int emu_get_current_position() __attribute__((noinline));
extern "C" int EMSCRIPTEN_KEEPALIVE emu_get_current_position() {
	return isReady ? playTime / sampleRate *1000 : -1;	
}

extern "C" void emu_seek_position(int pos) __attribute__((noinline));
extern "C" void EMSCRIPTEN_KEEPALIVE emu_seek_position(int pos) {
	playTime= pos/1000*sampleRate;
	player->p->seek(pos);
}

extern "C" int emu_get_max_position() __attribute__((noinline));
extern "C" int EMSCRIPTEN_KEEPALIVE emu_get_max_position() {
	return isReady ? totalTime : -1;
}

extern "C" int32_t**  emu_get_scope_buffers() {
	return isReady ? player->getScopeBuffers() : (int32_t**)0;
}
extern "C" int  emu_current_buffer_pos() {
	return isReady ? player->currentBufferPos() : 0;
}

// note: only implemented/tested for WoodyOPL emulator
extern "C" int emu_number_trace_streams() __attribute__((noinline));
extern "C" int EMSCRIPTEN_KEEPALIVE emu_number_trace_streams() {
	return OPL_SCOPE_CHANNELS();
}
extern "C" const char** emu_trace_streams() __attribute__((noinline));
extern "C" const char** EMSCRIPTEN_KEEPALIVE emu_trace_streams() {
	return (const char**)emu_get_scope_buffers();	// ugly cast to make emscripten happy
}

