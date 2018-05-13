::  POOR MAN'S DOS PROMPT BUILD SCRIPT.. make sure to delete the respective built/*.bc files before building!
::  existing *.bc files will not be recompiled. 

setlocal enabledelayedexpansion

SET ERRORLEVEL
VERIFY > NUL

:: **** use the "-s WASM" switch to compile WebAssembly output. warning: the SINGLE_FILE approach does NOT currently work in Chrome 63.. ****
set "OPT= -s WASM=0 -s VERBOSE=0 -s ASSERTIONS=0 -s FORCE_FILESYSTEM=1 -s TOTAL_MEMORY=33554432 -Wno-pointer-sign -Dstricmp=strcasecmp -DVERSION="\"2.2.1-webaudio\"" -I. -I../src/ -I../libbinio/ -Os -O3 "


:: only using (see adapter.cpp) the WoodyOPL so there is really no need to compile the alternative impls:
:: ../src/nukedopl.c ../src/nemuopl.cpp ../src/emuopl.cpp ../src/fmopl.c

if not exist "built/emus.bc" (
	call emcc.bat %OPT% ../src/woodyopl.cpp ../src/mus.cpp ../src/adl.cpp ../src/vgm.cpp ../src/sop.cpp ../src/mdi.cpp ../src/herad.cpp ../src/got.cpp ../src/cmfmcsop.cpp ../src/adlib.cpp ../src/fprovide.cpp ../src/mid.cpp ../src/sng.cpp ../src/ksm.cpp ../src/adplug.cpp ../src/rol.cpp ../libbinio/binwrap.cpp ../libbinio/binstr.cpp ../libbinio/binio.cpp ../libbinio/binfile.cpp ../src/adlibemu.c ../src/debug.c ../src/a2m.cpp ../src/adtrack.cpp ../src/amd.cpp ../src/analopl.cpp ../src/bam.cpp ../src/bmf.cpp ../src/cff.cpp ../src/cmf.cpp ../src/d00.cpp ../src/database.cpp ../src/dfm.cpp ../src/diskopl.cpp ../src/dmo.cpp ../src/dro2.cpp ../src/dro.cpp ../src/dtm.cpp ../src/flash.cpp ../src/fmc.cpp ../src/hsc.cpp ../src/hsp.cpp ../src/hybrid.cpp ../src/hyp.cpp ../src/imf.cpp ../src/jbm.cpp ../src/lds.cpp ../src/mad.cpp ../src/mkj.cpp ../src/msc.cpp ../src/mtk.cpp ../src/player.cpp ../src/players.cpp ../src/protrack.cpp ../src/psi.cpp ../src/rad.cpp ../src/rat.cpp ../src/raw.cpp ../src/realopl.cpp ../src/rix.cpp ../src/s3m.cpp ../src/sa2.cpp ../src/surroundopl.cpp ../src/temuopl.cpp ../src/u6m.cpp ../src/xad.cpp ../src/xsm.cpp -o built/emus.bc
	IF !ERRORLEVEL! NEQ 0 goto :END
)
emcc.bat %OPT%   --memory-init-file 0 --closure 1 --llvm-lto 1  built/emus.bc output.cpp adapter.cpp --js-library callback.js -s EXPORTED_FUNCTIONS="['_emu_init','_emu_teardown','_emu_set_subsong','_emu_get_track_info','_emu_get_audio_buffer','_emu_get_audio_buffer_length','_emu_compute_audio_samples','_emu_get_current_position','_emu_seek_position','_emu_get_max_position', '_malloc', '_free']" -o htdocs/adplug.js -s SINGLE_FILE=0 -s EXTRA_EXPORTED_RUNTIME_METHODS="['ccall', 'Pointer_stringify']"  -s BINARYEN_ASYNC_COMPILATION=1 -s BINARYEN_TRAP_MODE='clamp' && copy /b shell-pre.js + htdocs\adplug.js + shell-post.js htdocs\adplug3.js && del htdocs\adplug.js && copy /b htdocs\adplug3.js + adplug_adapter.js htdocs\backend_adplug.js && del htdocs\adplug3.js