#!/bin/sh
set -e

# ==============================================
# INCLUDES
# ==============================================
source "$(dirname $0)/functions.sh"

# ==============================================
# VARIABLES
# ==============================================

# default options
INPUT_DEFAULT="./translations"
OUTPUT_DEFAULT=("./app")
LANGUAGE_DEFAULT="en"
KEYS_DEFAULT=("t" "n:1,2")

# help message
HELP_MESSAGE=$(cat <<EOF
Usage: $0 [OPTIONS]

Options:
  -i Input directory (default: $INPUT_DEFAULT)
  -k Keys to be used for lookup (default: $KEYS_DEFAULT)
  -l Language of PO-File (default: $LANGUAGE_DEFAULT)
  -o Output directory (default: $OUTPUT_DEFAULT)
  -h Show help

Example:
  ./settext.sh -l de -k singlekey,pluralkey:1,2 -i ./mypodirectory -o ./myemberapp
EOF)

# ==============================================
# OPTIONS
# ==============================================

# extract command line arguments
while getopts ":hi:k:l:o" opt; do
  case $opt in
    h)
      echo "$HELP_MESSAGE"
      exit 1
      ;;
    i)
      INPUT=$OPTARG
      ;;
    k)
      IFS=',' #split
      KEYS=($OPTARG)
      ;;
    l)
      LANGUAGE=$OPTARG
      ;;
    o)
      IFS=',' #split
      OUTPUT=($OPTARG)
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
: ${LANGUAGE=$LANGUAGE_DEFAULT}
: ${INPUT=$INPUT_DEFAULT}

if [ -z "$OUTPUT" ]; then
  OUTPUT=("${OUTPUT_DEFAULT[@]}")
fi

if [ -z "$KEYS" ]; then
  KEYS=("${KEYS_DEFAULT[@]}")
fi

# ==============================================
# GLOBALS
# ==============================================
COUNT=0
MAXCNT=2
MSGID=""
MSGSTR=""
MSGID_PLURAL=""
MSGSTR=PLURAL=""
SCRIPTPATH=$(dirname "$0")

# ==============================================
# FUNCTIONS
# ==============================================

# resets all variables used in main program
function reset_variables {
  COUNT=0
  MAXCNT=2
  MSGID=""
  MSGSTR=""
  MSGID_PLURAL=""
  MSGSTR_PLURAL=""
}

# iterates through source files and tries
# to convert current $MSGSTR with $MSGID
function replace_msgid {
  find "${OUTPUT[@]}" \
    ! -path "${OUTPUT[0]}/*styleguide*" \
    ! -path "${OUTPUT[0]}/fixtures/*" \
    ! -path "${OUTPUT[0]}/mirage/*" \
    -name "*.hbs" \
    -or \
    -name "*.js" \
    -type f | \
      while read FILE
        do
          # map node module method
          case "${FILE##*.}" in
            "js")
                METHOD="replaceJS"
                ;;
            "hbs")
                METHOD="replaceHBS"
                ;;
            *)
                METHOD=""
                ;;
          esac

          # ignore unmatched methods
          # which should not be case
          if [ -z "$METHOD" ]; then
            continue
          fi

          # iterate keys and lookup
          # sources to replace them
          for KEY in "${KEYS[@]}"
            do
              #echo "KEY: $KEY"
              RESULT=$(\
                node -e \
                  "require('$SCRIPTPATH/settext').$METHOD(
                      \"$FILE\",
                      \"$KEY\",
                      \"$MSGID\",
                      \"$MSGSTR\",
                      \"$MSGID_PLURAL\",
                      \"$MSGSTR_PLURAL\"
                  )" \
              )

              if [ $RESULT == 1 ]; then
                echo "UPDATED: $FILE $(echo_pass)"
              fi
          done
      done
}

# ==============================================
# PROGRAM
# ==============================================

echo "\n"
echo "========================================"
echo "CHECKING PO FILE..."
echo "========================================"

POFILE="$INPUT/$LANGUAGE.po"

if [ ! -e "$POFILE" ]; then
  echo "PO-File not found: $POFILE $(echo_fail)"
  exit 1
else
  echo "PO-File found: $POFILE $(echo_pass)"
fi

echo "\n"
echo "========================================"
echo "PARSING SOURCE FILES..."
echo "========================================"

# iterate lines of PO file
while read LINE
  do
    # differentiate between msgid/msgstr
    if [ `expr $COUNT % 2` == 0 ]; then

      if [ $COUNT == 2 ]; then
        # if count is 2, this should be: msgstr[0] "" (single)
        MATCH=$(sed 's/msgstr\[0\].*"\(.*\)"/\1/g' <<< $LINE)
        MSGSTR=$MATCH
      else
        # first line of EACH message is always: msgid ""
        MATCH=$(sed 's/msgid.*"\(.*\)"/\1/g' <<< $LINE)
        MSGID=$MATCH
      fi
    else
      # second line can be one of: msgstr "" | msgid_plural ""
      MATCH=$(sed 's/msgid_plural.*"\(.*\)"/\1/g' <<< $LINE)

      # no msgid_plural pattern found, this is single form
      if [ "$MATCH" == "$LINE" ]; then

        if [ $COUNT == 3 ]; then
          # if count is 3, this should be: msgstr[1] "" (plural)
          MATCH=$(sed 's/msgstr\[1\].*"\(.*\)"/\1/g' <<< $LINE)
          MSGSTR_PLURAL=$MATCH
        else
          # second line of a single message is always: msgstr ""
          MATCH=$(sed 's/msgstr.*"\(.*\)"/\1/g' <<< $LINE)
          MSGSTR=$MATCH
        fi
      else
        # save plural msgid and increment
        # max counter to get all 4 lines!
        MSGID_PLURAL=$MATCH
        MAXCNT=$((MAXCNT*2))
      fi
    fi

    # skip lines not matching pattern
    if [ "$MATCH" == "$LINE" ]; then
      continue
    fi

    # skip empty header entry
    if [ -z "$MATCH" ]; then
      continue
    fi

    # convert msgid -> msgstr
    LIMIT=$((MAXCNT - 1))
    if [ $COUNT == $LIMIT ]; then
      echo "\n---\n"
      echo "MSGID: $MSGID"

      if [ -n "$MSGID_PLURAL" ]; then
        echo "MSGID_PLURAL: $MSGID_PLURAL"
      fi

      echo "MSGSTR: $MSGSTR"

      if [ -n "$MSGSTR_PLURAL" ]; then
        echo "MSGSTR_PLURAL: $MSGSTR_PLURAL"
      fi

      replace_msgid
    fi

    # increment counter to
    # get msgstr next time
    COUNT=$((COUNT + 1))

    # reset variables to
    # match the next pair
    if [ $COUNT == $MAXCNT ]; then
      reset_variables
    fi

done < $POFILE

echo "\n$(echo_pass FINISHED)"
