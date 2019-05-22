/*
 * AdPlay/UNIX - OPL2 audio player
 * Copyright (C) 2001 - 2003 Simon Peter <dn.tlp@gmx.net>
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2, or (at your option)
 * any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software Foundation,
 * Inc., 59 Temple Place - Suite 330, Boston, MA 02111-1307, USA.  
 */

#include <stdio.h>
#include <emuopl.h>
#include <kemuopl.h>


#include "output.h"
#include "defines.h"

/***** Player *****/

Player::Player()
  : p(0), playing(false)
{
}

Player::~Player()
{
  if(p) delete p;
}

/***** EmuPlayer *****/

EmuPlayer::EmuPlayer(Copl *nopl, unsigned char nbits, unsigned char nchannels,
		     unsigned long nfreq, unsigned long nbufsize)
  : opl(nopl), buf_size(nbufsize), freq(nfreq), bits(nbits), channels(nchannels)
{
	audiobuf = new char [buf_size * getsampsize()];
  
  	// "scope" streams
	allocScopeBuffers(buf_size);
}

EmuPlayer::~EmuPlayer()
{
  delete [] audiobuf;
  allocScopeBuffers(0);
}

// Some output plugins (ALSA) need to change the buffer size mid-init
void EmuPlayer::setbufsize(unsigned long nbufsize)
{
	delete [] audiobuf;
	buf_size = nbufsize;
	audiobuf = new char [buf_size * getsampsize()];

	allocScopeBuffers(buf_size);
}

// hack to sync "scope" buffers without touching existing AdPlug APIs
int  EmuPlayer::currentBufferPos() {
	return scopeBufferPos;
}

void EmuPlayer::frame()
{
  static long minicnt = 0;
  long i, towrite = buf_size;
  char *pos = audiobuf;
  scopeBufferPos= 0;

  // clear scope buffers
	for (int i= 0; i<MAX_SCOPES; i++) {
		memset(_scopeBuffers[i], 0, sizeof(int)*_scopeBufferLen); 
	}
  
  // Prepare audiobuf with emulator output
  while(towrite > 0) {
    while(minicnt < 0) {
      minicnt += freq;
      playing = p->update();
    }
    i = min(towrite, (long)(minicnt / p->getrefresh() + 4) & ~3);
    opl->update((short *)pos, i);
    pos += i * getsampsize(); towrite -= i;
	scopeBufferPos+= i;
    minicnt -= (long)(p->getrefresh() * i);
  }

  // call output driver
  output(audiobuf, buf_size * getsampsize());
}

int32_t* EmuPlayer::_scopeBuffers[MAX_SCOPES] = {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,};
int EmuPlayer::_scopeBufferLen= 0;	

void EmuPlayer::allocScopeBuffers(unsigned long size) {
	// size in sync with audio buffer	
	if (_scopeBufferLen != size) {
		_scopeBufferLen= size;
	  
		for (int i= 0; i<MAX_SCOPES; i++) {
			if (_scopeBuffers[i] != 0)   {
				delete [] (_scopeBuffers[i]);
				_scopeBuffers[i]= 0;
			}			
			_scopeBuffers[i]= size ? new int[size] : 0;
		}
	}
}

int32_t** EmuPlayer::getScopeBuffers() {
	return _scopeBuffers;
}

/***** BufPlayer *****/

BufPlayer::BufPlayer(Copl *nopl, unsigned char bits,
		     int channels, int freq, unsigned long bufsize)
  : EmuPlayer(nopl, bits, channels, freq, bufsize)
{
	extAudiobuf = new char [buf_size * getsampsize()];
}


BufPlayer::~BufPlayer()
{
  delete [] extAudiobuf;  
}

void BufPlayer::setbufsize(unsigned long nbufsize)
{
	EmuPlayer::setbufsize(nbufsize);
	delete [] extAudiobuf;
	extAudiobuf = new char [buf_size * getsampsize()];	
}


void BufPlayer::output(const void *buf, unsigned long size)
{
	memcpy(extAudiobuf, audiobuf, buf_size * getsampsize());
}

const void* BufPlayer::getSampleBuffer() 
{
	return extAudiobuf;
}

unsigned long BufPlayer::getSampleBufferSize() 
{
	return buf_size * getsampsize();
}
