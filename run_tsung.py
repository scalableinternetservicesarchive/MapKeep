#! /usr/bin/env python

from subprocess import Popen, PIPE
import os
import sys
import argparse
import zipfile
from xml.dom import minidom
import logging

def main():
    parser = argparse.ArgumentParser(description='Run a tsung test')
    parser.add_argument('filename', metavar='filename', type=str,
                        help='filename to a valid tsung xml test instance')
    parser.add_argument('--no-replace', action='store_true', dest='no_replace',
                        help='do not replace the server xml attribute to the current hostname')
    args = parser.parse_args()
    
    logging.debug('Filename: {0}, no_replace: {1}'.format(args.filename, args.no_replace))

    if not os.path.exists(args.filename):
        logging.error('Not a valid tsung test case: {0}'.format(args.filename))
        sys.exit(2)

    hostname = get_public_hostname()

    if not args.no_replace:
        logging.info('Replace server name attribute with {0}'.format(hostname))
        replace_tsung_server(args.filename, args.no_replace)

    # Start the script
    try:
        log_path = start_tsung(args.filename)
    except Exception as e:
        logging.error(e)
        sys.exit(1)

    compile_tsung_report(log_path)

    report_file = os.path.join(log_path, 'report.html')
    if not os.path.exists(report_file):
        logging.error('Report file {0} does not exist. Tsung failed to compile'.format(report_file))
        sys.exit(1)

    print 'Tsung succesfully ran. The report and zip can be found at:'
    print os.path.join(hostname, os.path.split(log_path)[1], 'report.html')
    print os.path.join(hostname, log_path.rstrip('\\') + '.py')


def get_public_hostname():
    """ Get the public hostname of the ec2 instance """
    proc = Popen(['ec2-metadata', '--public-hostname'], stdout=PIPE)
    hostname = proc.communicate()[0]
    logging.info(hostname)
    return hostname.split()[1]

def replace_tsung_server(filename, hostname):
    """ Replace the server host attribute with a custom value

    Parameters:
        filename (str):  filename of the xml to do the operation on
        hostname (str):  the value of the server host attribute to replace with
    """
    dom = minidom.parse(filename)
    dom.getElementsByTagName('server')[0].setAttribute('host', hostname)
    with open(filename, 'w') as f:
        f.write(dom.toxml())
    logging.info('Successfully saved modified xml document')

def start_tsung(filename):
    """ Start the tsung testing

    Parameters:
        filename (str): valid path to a tsung xml file
    Returns:
        (str): A valid path to the current tsung test instance log files
    """
    logging.info('Running tsung with test instance {0}'.format(filename))
    proc = Popen(['tsung', '-f', filename, 'start'], stdout=PIPE)
    log_path = proc.communicate()[0]
    
    if proc.returncode != 0:
        raise RuntimeError("Tsung did not run successfully")
    
    # Remove the quotes and take only the directory name
    log_path = log_path.replace('"', '').split()[-1]
    logging.info('Log directory is: {0}'.format(log_path))

    if not os.path.exists(log_path):
        raise OSError("Tsung log path does not exist: ".format())
    
    return log_path

def compile_tsung_report(log_path):
    """ Compile the tsung report using tsung_stats.pl

    Paramters:
        log_path (str): path where the logs are stored for this session
    """
    logging.info('Compiling the tsung statistics')
    proc = Popen(['tsung_stats.pl'], cwd=log_path)
    return proc.communicate()[1]

def zip_directory(log_path):
    """ Zip up the everything in the current directory

    This will save the current contents of the log folder into a file that
    is stored a level above. This means it will be available via the aws
    link that is given.

    Paramters:
        log_path (str): path of the logs to zip
    """
    store_path, filename = os.path.split(log_path.rstrip('\\'))
    # just in case the log_path is ended by a forward slash
    if not filename:
        store_path, filename = os.path.split(store_path)

    with zipfile.ZipFile(os.path.join(store_path, filename + '.py'), 'w') as zf:
        for root, dirs, files in os.walk(log_path):
            for file in files:
                zf.write(os.path.join(root, file))

if __name__ == '__main__':
    logging.basicConfig(filename='run_tsung.log', level=logging.DEBUG)
    main()