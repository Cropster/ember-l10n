#!/bin/sh
set -e

# ==============================================
# Functions
# ==============================================
function program_is_installed {
	# set to 1 initially
	local return_=1
	# set to 0 if not found
	type $1 >/dev/null 2>&1 || { local return_=0; }
	# return value
	echo "$return_"
}

function npm_package_is_installed {
	# set to 1 initially
	local return_=1
	# set to 0 if not found
	ls node_modules | grep $1 >/dev/null 2>&1 || { local return_=0; }
	# return value
	echo "$return_"
}

function echo_fail {
	# echo first argument in red
	printf "\e[31m✘ ${1}"
	# reset colours back to normal
	echo "\033[0m"
}

function echo_warn {
	# echo first argument in red
	printf "\e[33m⚠ ${1}"
	# reset colours back to normal
	echo "\033[0m"
}

function echo_pass {
	# echo first argument in green
	printf "\e[32m✔ ${1}"
	# reset colours back to normal
	echo "\033[0m"
}

function echo_if {
	if [ $1 == 1 ]; then
		echo_pass $2
	else
		echo_fail $2
	fi
}

# ==============================================
# VARIABLES
# ==============================================

# default options
JSON_OUTPUT_DEFAULT="./public/assets/locales"
PACKAGE_NAME_DEFAULT="Cropster App"
PACKAGE_VERSION_DEFAULT="1.0"
OUTPUT_DEFAULT="./translations"
DOMAIN_POT_DEFAULT="$OUTPUT_DEFAULT/domain.pot"
FROM_CODE_DEFAULT="UTF-8"
LANGUAGE_DEFAULT="en"
INPUT_DEFAULT="./app"
KEYS_DEFAULT=("t" "n:1,2") # "k:1,2" for plural forms!

# https://www.gnu.org/software/gettext/manual/html_node/Plural-forms.html
PLURAL_FORMS_DEFAULT="nplurals=2; plural=(n!=1);"

INSTALL_DEPS_DEFAULT=0

# help message
HELP_MESSAGE=$(cat <<EOF
Usage: $0 [OPTIONS]

Options:
		-d Domain pot file (default: $DOMAIN_POT_DEFAULT)
		-e Input encoding (default: $FROM_CODE_DEFAULT)
		-i Input directory (default: $INPUT_DEFAULT)
		-j JSON output directory (default: $JSON_OUTPUT_DEFAULT)
		-k Keys to be used for lookup (default: $KEYS_DEFAULT)
		-l Target language of PO-File (default: $LANGUAGE_DEFAULT)
		-n Plural Forms (default: $PLURAL_FORMS_DEFAULT)
		-o Output directory (default: $OUTPUT_DEFAULT)
		-p Package Name (default: $PACKAGE_NAME_DEFAULT)
		-v Package Version (default: $PACKAGE_VERSION_DEFAULT)
		-I Install dependencies automatically (default: $INSTALL_DEPS_DEFAULT)
		-h Show help

Example:
		./gettext.sh -l de -k singlekey,pluralkey:1,2 -i ./myemberapp -o ./mypodirectory -j ./myjsondirectory -p "Cropster Hub" -v 1.0
EOF)

# ==============================================
# Options
# ==============================================

# extract command line arguments
while getopts ":d:e:hi:j:k:l:n:o:p:v:Ih" opt; do
	case $opt in
		d)
			DOMAIN_POT=$OPTARG
			;;
		e)
			FROM_CODE=$OPTARG
			;;
		h)
			echo "$HELP_MESSAGE"
			exit 1
			;;
		i)
			INPUT=$OPTARG
			;;
		j)
			JSON_OUTPUT=$OPTARG
			;;
		k)
			IFS=',' #split
			KEYS=($OPTARG)
			;;
		l)
			LANGUAGE=$OPTARG
			;;
		n)
			PLURAL_FORMS=$OPTARG
			;;
		o)
			OUTPUT=$OPTARG
			;;
		p)
			PACKAGE_NAME=$OPTARG
			;;
		v)
			PACKAGE_VERSION=$OPTARG
			;;
		I)
			INSTALL_DEPS=1
			;;
		:)
			echo "Error: Option -$OPTARG requires an argument. $(echo_fail)\n" >&2
			echo "$HELP_MESSAGE"
			exit 1
			;;
		\?)
			echo "Error: Invalid Option -$OPTARG. $(echo_fail)\n" >&2
			echo "$HELP_MESSAGE"
			exit 1
			;;
	esac
done

# set args or fall back to defaults
: ${PACKAGE_VERSION=$PACKAGE_VERSION_DEFAULT}
: ${PLURAL_FORMS=$PLURAL_FORMS_DEFAULT}
: ${PACKAGE_NAME=$PACKAGE_NAME_DEFAULT}
: ${JSON_OUTPUT=$JSON_OUTPUT_DEFAULT}
: ${DOMAIN_POT=$DOMAIN_POT_DEFAULT}
: ${FROM_CODE=$FROM_CODE_DEFAULT}
: ${LANGUAGE=$LANGUAGE_DEFAULT}
: ${OUTPUT=$OUTPUT_DEFAULT}
: ${INPUT=$INPUT_DEFAULT}
: ${INSTALL_DEPS=$INSTALL_DEPS_DEFAULT}

if [ -z "$KEYS" ]; then
	KEYS=("${KEYS_DEFAULT[@]}")
fi

# ==============================================
# Program
# ==============================================
echo "\n"
echo "========================================"
echo "CHECKING PREREQUISITES..."
echo "========================================"

CURRENT_DIR="$(pwd)"


# 0) sed detection
# the OS X sed is very limited, many devs have installed gnu gettext
# but we should handle both

set +e
sed --version &> /dev/null
if [ $? == 1 ]; then
	echo "sed: OS X $(echo_pass)"
	sed_args="-i ''"
else
	echo "sed: GNU $(echo_pass)"
	sed_args="-i"
fi
set -e

# 1) CHECK FOR GETTEXT (gnu library)
HAS_GETTEXT=$(program_is_installed xgettext)
echo "gettext $(echo_if $HAS_GETTEXT)"

# CHECK FOR XGETTEXT TEMPLATE (npm package)
BIN_XGETTEXTTEMPLATE="$CURRENT_DIR/node_modules/xgettext-template/bin/xgettext-template"
HAS_XGETTEXTTEMPLATE=$(npm_package_is_installed xgettext-template)
echo "xgettext-template $(echo_if $HAS_XGETTEXTTEMPLATE)"

# CHECK FOR PO2JSON (npm package)
BIN_GETTEXTJS="$CURRENT_DIR/node_modules/gettext.js/bin/po2json"
HAS_GETTEXTJS=$(npm_package_is_installed gettext.js)
echo "po2json $(echo_if $HAS_GETTEXTJS)"

if [ $HAS_GETTEXT == 1 ] && [ $HAS_XGETTEXTTEMPLATE == 1 ] && [ $HAS_GETTEXTJS == 1 ]; then
	MISSING_DEPS=0
else
	MISSING_DEPS=1
fi

if [ $MISSING_DEPS == 1 ] && [ $INSTALL_DEPS == 1 ]; then
	if [ $HAS_GETTEXT == 0 ]; then
		echo "\nINSTALLING GETTEXT..."

		# create tmp directory for gettext
		GETTEXT_TMP=$(mktemp -d /tmp/gettext_tmp.XXXXXX)

		# get latest gettext from gnu ftp server
		curl -L http://ftp.gnu.org/pub/gnu/gettext/gettext-latest.tar.gz | \
			tar -xz - -C $GETTEXT_TMP --strip-components=1

		# install gettext
		cd $GETTEXT_TMP
		sh ./configure
		make
		make install
		make clean
		make distclean

		# cleanup install
		cd $CURRENT_DIR
		rm -rf $GETTEXT_TMP
	fi

	if [ $HAS_XGETTEXTTEMPLATE == 0 ]; then
		echo "\nINSTALLING XGETTEXT_TEMPLATE..."
		npm install xgettext-template --save-dev
	fi

	if [ $HAS_GETTEXTJS == 0 ]; then
		echo "\nINSTALLING GETTEXTJS..."
		npm install gettext.js --save-dev
	fi
elif [ $MISSING_DEPS == 1 ]  && [ $INSTALL_DEPS == 0 ]; then
	echo ""
	echo $(echo_warn "You are missing runtime dependencies.")
	echo "Please pass the -I flag to install them automatically or install them manually."
	echo "See the readme for details."
	exit 1
fi


# CREATE DOMAIN POT FILE AT FIRST
mkdir -p $OUTPUT
if [ ! -e "$DOMAIN_POT" ]; then
	touch $DOMAIN_POT
	echo "
	msgid \"\"
	msgstr \"\"
	\"Language: ${LANGUAGE}\\\\n\"
	\"Content-Type: text/plain; charset=${FROM_CODE}\\\\n\"
	\"Plural-Forms: nplurals=INTEGER; plural= EXPRESSION;\\\\n\"" > $DOMAIN_POT
fi

# create tmp pot file, we don't want to mess up
# original pot file containing static messages!
DOMAIN_POT_TMP=$(mktemp /tmp/domainpot.XXXXXX)
cp $DOMAIN_POT $DOMAIN_POT_TMP

# EXTRACT JAVASCRIPT TRANSLATIONS
echo "\n"
echo "========================================"
echo "EXTRACTING JAVASCRIPT TRANSLATIONS..."
echo "========================================"

# create --keyword=a --keyword=b ...
KEY_ARGS=$(echo "${KEYS[@]/#/--keyword=}")

find $INPUT \
	! -path "$INPUT/*styleguide*" \
	! -path "$INPUT/fixtures/*" \
	! -path "$INPUT/mirage/*" \
	-name "*.js" \
	-type f | \
	while read file
	do
		# invoke xgettext utility
		XGETTEXT_OUTPUT=$(xgettext \
			--msgid-bugs-address="support@cropster.com" \
			--package-version="$PACKAGE_VERSION" \
			--package-name="$PACKAGE_NAME" \
			--copyright-holder="Cropster" \
			--output=$DOMAIN_POT_TMP \
			--from-code=$FROM_CODE \
			--language=JavaScript \
			--join-existing \
			--force-po \
			$KEY_ARGS \
			$file 2>&1)

		# log output to stdout
		if [ -n "$XGETTEXT_OUTPUT" ]; then
			echo "$XGETTEXT_OUTPUT $(echo_warn)"
		else
			echo "$file $(echo_pass)"
		fi
	done

	# EXTRACT TEMPLATE TRANSLATIONS
	echo "\n"
	echo "========================================"
	echo "EXTRACTING TEMPLATE TRANSLATIONS..."
	echo "========================================"

	# create --keyword a,b ...
	KEY_ARGS=$(IFS=,; echo "--keyword ${KEYS[*]}")
	HAS_ERROR=0

	find $INPUT \
		! -path "$INPUT/*styleguide*" \
		! -path "$INPUT/fixtures/*" \
		! -path "$INPUT/mirage/*" \
		-name "*.hbs" \
		-type f | \
		while read file
		do
			# create tmp files for parser and message merging as
			# xgettext-template doesn't support --join-existing!
			PO_FILE="${file%.*}.po"
			HBS_FILE="${file%.*}.i18n.hbs"
			PO_FILE_TMP=$(mktemp /tmp/po.XXXXXX)
			POT_FILE_TMP=$(mktemp /tmp/pot.XXXXXX)

			# clean all whitespaces from .hbs files, otherwise
			# xgettext-template included parser doesn't work!
			#
			FILE_CAT_OUTPUT=$(cat $file 2>&1)
			if [ ! $? == 0 ]; then
				echo "Cannot open file $file! $(echo_warn)"
				HAS_ERROR=1
				exit 1
			fi

			echo $FILE_CAT_OUTPUT | sed 's/\s+/ /g' > $HBS_FILE

			# invoke xgettext-template with provided options
			node $BIN_XGETTEXTTEMPLATE \
				--from-code $FROM_CODE \
				--language Handlebars \
				--output $PO_FILE \
				--force-po true \
				$KEY_ARGS \
				$HBS_FILE

			# prepend header info for gettext msgcat, as node module
			# doesn't prepend necessary info and has no options yet!
			sed $sed_args '1,2d' $PO_FILE # remove first to lines of file
			echo "
			msgid \"\"
			msgstr \"\"
			\"Content-Type: text/plain; charset=${FROM_CODE}\\\\n\"" | \
				cat - $PO_FILE > $PO_FILE_TMP && mv $PO_FILE_TMP $PO_FILE

			# merge created .po file with existing translations
			MSGCAT_OUTPUT=$(msgcat \
				--output-file=$POT_FILE_TMP \
				--to-code=$FROM_CODE \
				--lang="$LANGUAGE" \
				--use-first \
				--unique \
				$DOMAIN_POT_TMP $PO_FILE 2>&1)

			# overwrite domain pot from tmp pot
			mv $POT_FILE_TMP $DOMAIN_POT_TMP

			# remove tmp files
			rm -f $POT_FILE_TMP
			rm -f $PO_FILE_TMP
			rm -f $HBS_FILE
			rm -f $PO_FILE

			# log output to stdout
			if [ -n "$MSGCAT_OUTPUT" ]; then
				echo "$MSGCAT_OUTPUT $(echo_warn)"
			else
				echo "$file $(echo_pass)"
			fi
		done

		if [ $HAS_ERROR == 1 ]; then
			echo "Stopped extraction due to errors! $(echo_warn)"
			exit 1
		fi

		# CREATE OR UPDATE TRANSLATIONS
		echo "\n"
		echo "========================================"
		echo "CREATE/UPDATE TRANSLATIONS..."
		echo "========================================"

		LANGUAGE_PO_FILE="$OUTPUT/$LANGUAGE.po"

		# a) NEW TRANSLATIONS
		# target po file doesn't exist, create
		# one with gettext's msginit utiltity!
		if [ ! -e "$LANGUAGE_PO_FILE" ] ; then
			# invoke msginit to create new po file
			msginit \
				--output-file=$LANGUAGE_PO_FILE \
				--input=$DOMAIN_POT_TMP \
				--locale=$LANGUAGE \
				--no-translator

			# replace auto-generated plural forms with
			# provided/default ones for gettext.js lib

			sed $sed_args 's/"Plural-Forms:\(.*\)\\n"/"Plural-Forms: '"${PLURAL_FORMS}"'\\n"/g' ${LANGUAGE_PO_FILE}

			# b) EXISTING TRANSLATIONS
			# target po file already exists, so we
			# merge existing with new translations
		else
			# invoke msgmerge to combine translations
			LANGUAGE_PO_FILE_TMP=$(mktemp /tmp/$LANGUAGE_$COUNTRY_CODE.XXXXXX)
			msgmerge \
				--output-file=$LANGUAGE_PO_FILE_TMP \
				--lang=$LANGUAGE \
				--force-po \
				--verbose \
				$LANGUAGE_PO_FILE $DOMAIN_POT_TMP

			mv $LANGUAGE_PO_FILE_TMP $LANGUAGE_PO_FILE
			rm -f $LANGUAGE_PO_FILE_TMP
		fi

		# create json files from po
		mkdir -p $JSON_OUTPUT
		node $BIN_GETTEXTJS \
			$LANGUAGE_PO_FILE \
			"$JSON_OUTPUT/$LANGUAGE.json" \
			-p

		# clean domain pot tmp file
		rm -f $DOMAIN_POT_TMP

		echo "\n$(echo_pass FINISHED)"
