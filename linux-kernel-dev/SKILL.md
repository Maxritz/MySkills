---
name: linux-kernel-dev
description: "Linux kernel development: modules, drivers, KASAN, ftrace, lockdep, perf, crash debugging. Kernel-space and kernel/driver boundary work."
compatibility: opencode
metadata:
  loading: on-demand
  auto_unload: true
  trigger_keywords: ["Linux kernel", "kernel module", "driver", "KASAN", "ftrace", "lockdep", "perf", "crash", "kdump", "kselftest", "kunit", "slabinfo", "vmstat"]
---

# Linux Kernel Development

**Kernel-space and kernel/driver boundary work.**

---

## Mandatory Capture

```
Kernel version: 6.10.0 / commit abc123
Architecture: x86_64 / arm64
Config: defconfig + CONFIG_DEBUG_INFO=y + CONFIG_KASAN=y
Hardware: CPU model, firmware, exact device
Boot params: cmdline, initrd, secure boot state
Reproducer: exact steps, dmesg snippet, crash dump
```

## Subsystem Localisation

| Subsystem | Tools | Key Checks |
|-----------|-------|------------|
| **Memory/MM** | `kmemleak`, KASAN, `slabinfo`, `vmstat` | Page allocation, compound pages, page migration, NUMA |
| **Scheduler** | `schedstat`, `perf sched`, tracepoints | CFS, RT, DL, wakeup latency, affinity |
| **Block/IO** | `blktrace`, `btt`, `iolatency` | Request queue, elevator, bio splitting, flush |
| **Network** | `tcpdump`, `dropmonitor`, `netdevsim` | SKB lifecycle, NAPI, XDP, TC |
| **Drivers** | `devlink`, `dmesg -T`, `lsmod` | Probe order, PM runtime, MSI/MSI-X, DMA mapping |
| **Locking** | `lockdep`, `lockstat`, `mutex_debug` | Lock ordering, deadlock, IRQ safety, RCU grace periods |

## Debugging Workflow

```bash
# 1. Early boot: qemu + GDB
qemu-system-x86_64 -kernel bzImage -initrd initrd.img -s -S -append "earlyprintk=serial"

# 2. Runtime: ftrace
echo function > /sys/kernel/debug/tracing/current_tracer
echo schedule > /sys/kernel/debug/tracing/set_ftrace_filter
cat /sys/kernel/debug/tracing/trace

# 3. Crash: kdump + crash
crash vmlinux /var/crash/vmcore

# 4. Memory: KASAN
echo 1 > /sys/kernel/debug/kasan/enable
# Boot with: kasan=on page_poison=1 slub_debug=P

# 5. Locking: lockdep
echo 1 > /sys/kernel/debug/lockdep/enable
```

## Module Development

```c
// Minimal module structure
#include <linux/init.h>
#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/fs.h>
#include <linux/cdev.h>
#include <linux/device.h>
#include <linux/uaccess.h>
#include <linux/slab.h>
#include <linux/mutex.h>

#define DEVICE_NAME "mydev"
#define CLASS_NAME "myclass"

static dev_t dev_num;
static struct cdev my_cdev;
static struct class* my_class;
static struct device* my_device;
static DEFINE_MUTEX(dev_mutex);
static char* buffer;
static size_t buffer_size;

static int my_open(struct inode* inode, struct file* file) {
    mutex_lock(&dev_mutex);
    mutex_unlock(&dev_mutex);
    return 0;
}

static ssize_t my_read(struct file* file, char __user* ubuf, size_t count, loff_t* ppos) {
    if (*ppos >= buffer_size) return 0;
    size_t to_copy = min(count, buffer_size - *ppos);
    if (copy_to_user(ubuf, buffer + *ppos, to_copy)) return -EFAULT;
    *ppos += to_copy;
    return to_copy;
}

static struct file_operations fops = {
    .owner = THIS_MODULE,
    .open = my_open,
    .read = my_read,
    .write = my_write,
    .release = my_release,
    .llseek = default_llseek,
};

static int __init my_init(void) {
    int ret;
    ret = alloc_chrdev_region(&dev_num, 0, 1, DEVICE_NAME);
    if (ret) return ret;
    
    cdev_init(&my_cdev, &fops);
    my_cdev.owner = THIS_MODULE;
    ret = cdev_add(&my_cdev, dev_num, 1);
    if (ret) goto err_cdev;
    
    my_class = class_create(THIS_MODULE, CLASS_NAME);
    if (IS_ERR(my_class)) { ret = PTR_ERR(my_class); goto err_class; }
    
    my_device = device_create(my_class, NULL, dev_num, NULL, DEVICE_NAME);
    if (IS_ERR(my_device)) { ret = PTR_ERR(my_device); goto err_device; }
    
    buffer = kmalloc(PAGE_SIZE, GFP_KERNEL);
    if (!buffer) { ret = -ENOMEM; goto err_buffer; }
    buffer_size = PAGE_SIZE;
    
    pr_info("mydev: loaded, major=%d\n", MAJOR(dev_num));
    return 0;

err_buffer: device_destroy(my_class, dev_num);
err_device: class_destroy(my_class);
err_class:  cdev_del(&my_cdev);
err_cdev:   unregister_chrdev_region(dev_num, 1);
    return ret;
}

static void __exit my_exit(void) {
    kfree(buffer);
    device_destroy(my_class, dev_num);
    class_destroy(my_class);
    cdev_del(&my_cdev);
    unregister_chrdev_region(dev_num, 1);
    pr_info("mydev: unloaded\n");
}

module_init(my_init);
module_exit(my_exit);
MODULE_LICENSE("GPL");
MODULE_AUTHOR("Name");
MODULE_DESCRIPTION("Minimal char device");
```

## Validation Gates

| Gate | Command | Pass Criteria |
|------|---------|---------------|
| **Build** | `make -j$(nproc) W=1` | 0 warnings (or documented) |
| **Static** | `sparse -Wbitwise -Wcontext -Wcast /` | 0 new warnings |
| **KASAN** | Boot with `kasan=on` | No splats on reproducer |
| **Lockdep** | Boot with `lockdep=on` | No splats on reproducer |
| **Reproducer** | `insmod mymod.ko; test.sh` | Expected behavior |
| **Regression** | `kselftest / kunit` | All pass |

## Boundaries

- Does not write userspace C/C++ (see `c-systems`)
- Does not manage userspace memory allocators (see `linux-user`)
- Does not cover bare-metal kernel (see `bare-metal-kernel`)
- Does not cover x86 architecture (see `x86-arch`)
- Does not cover memory management (see `memory-mgmt`)
- `stop linux-kernel-dev`: revert.