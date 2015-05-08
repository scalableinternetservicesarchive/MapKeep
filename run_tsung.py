#! /usr/bin/env python

from subprocess import Popen, PIPE
import os
import sys
import argparse
from xml.dom import minidom

def main():
    parser = argparse.ArgumentParser(description='Run a tsung test')
    parser.add_argument('filename', metavar='filename', type=str,
                        help='filename to a valid tsung xml test instance')
    parser.add_argument('--no-replace', action='store_false', metavar='no_replace',
                        help='do not replace the server xml attribute to the current hostname')
    args = parser.parse_args()
    
    if not os.path.exists(args.filename):
        print 'Not a valid tsung test case: {}'.format(args.filename)
        sys.exit(2)

    hostname = get_public_hostname()

    if not no_replace:
        print 'Replace server name attribute with {}'.format(hostname)
        replace_tsung_server(args.filename, args.no_replace)

    # Start the script
    try:
        log_path = start_tsung(args.filename)
    except e:
        print e
        sys.exit(1)

    compile_tsung_report(log_path)

    report_file = os.path.join(log_path, 'report.html')
    if not os.path.exists(report_file):
        print 'Report file {} does not exist. Tsung failed to compile'.format(report_file)
        sys.exit(1)

    print 'Tsung succesfully ran. The report can be found at:'
    print os.path.join(hostname, os.path.split(log_path)[1], 'report.html')


def get_public_hostname():
    """ Get the public hostname of the ec2 instance """
    proc = Popen(['ec2-metadata', '--public-hostname'], stdout=PIPE)
    hostname = proc.communicate()[0]
    print hostname
    return hostname.split()[1]

def replace_tsung_server(file, hostname):
    dom = minidom.parse(file)
    dom.getElementsByTagName('server')[0].setAttribute('host', hostname)
    with open(file, 'w') as f:
        f.write(dom.toxml())

def start_tsung(filename):
    """ Start the tsung testing

    Parameters:
        filename (str): valid path to a tsung xml file
    Returns:
        (str): A valid path to the current tsung test instance log files
    """
    print 'Running tsung with test instance {}'.filename
    proc = Popen(['tsung', '-f', filename, 'start'], stdout=PIPE)
    log_path = proc.communicate()[0]
    
    if proc.returncode != 0:
        raise RuntimeError("Tsung did not run successfully")
    
    # Remove the quotes and take only the directory name
    log_path = log_path.replace('"', '').split()[-1]
    print 'Log directory is: {}'.format(log_path)

    if not os.path.exists(log_path):
        raise OSError("Tsung log path does not exist: ".format())
    
    return log_path

def compile_tsung_report(log_path):
    """ Compile the tsung report using tsung_stats.pl"""
    print 'Compiling the tsung statistics'
    proc = Popen(['tsung_stats.pl'], cwd=log_path)
    return proc.communicate()[1]

if __name__ == '__main__':
    main()