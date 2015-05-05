#! /usr/bin/env python

from subprocess import Popen, PIPE
import os
import sys
import argparse

def main():
	parser = argparse.ArgumentParser(description='Run a tsung test')
	parser.add_argument('filename', metavar='filename', type=str,
						help='filename to a valid tsung xml test instance')
	args = parser.parse_args()
	
	if not os.path.exists(args.filename):
		print 'Not a valid tsung test case: {}'.format(args.filename)
		sys.exit(2)

def get_public_hostname():
	""" Get the public hostname of the ec2 instance """
	proc = Popen(['ec2-metadata', '--public-hostname'], stdout=PIPE)
	hostname = proc.communicate()[0]
	return hostname.split()[1]

def replace_tsung_server(file, hostname):
	pass

def start_tsung(filename):
	""" Start the tsung testing

	Parameters:
		filename (str): valid path to a tsung xml file
	Returns:
		(str): A valid path to the current tsung test instance log files
	"""
	proc = Popen(['tsung', '-f', filename, 'start'], stdout=PIPE)
	log_path = proc.communicate()[0]
	
	if proc.returncode != 0:
		raise RuntimeError("Tsung did not run successfully")
	
	# Remove the quotes and take only the directory name
	log_path = log_path.replace('"', '').split()[-1]
	
	if not os.path.exists(log_path):
		raise OSError("Tsung log path does not exist: ".format())
	
	return log_path

def compile_tsung_report(log_path):
	pass

if __name__ == '__main__':
	main()